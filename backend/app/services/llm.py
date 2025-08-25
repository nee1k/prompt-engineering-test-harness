import difflib
import os
from typing import Optional

import httpx
from fastapi import HTTPException
from openai import OpenAI


# Lazily or conditionally initialize the OpenAI client to avoid requiring an API key during tests
if os.getenv("TESTING") == "true":
    openai_client = None
else:
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def call_ollama(
    prompt: str,
    model: str,
    temperature: float,
    max_tokens: int,
    top_p: float,
    top_k: Optional[int] = None,
):
    ollama_host = os.getenv("OLLAMA_HOST", "host.docker.internal")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"http://{ollama_host}:11434/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "options": {
                        "temperature": temperature,
                        "top_p": top_p,
                        "top_k": top_k,
                        "num_predict": max_tokens,
                    },
                    "stream": False,
                },
                timeout=60.0,
            )
            response.raise_for_status()
            result = response.json()
            return result.get("response", "").strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama API error: {str(e)}")


async def call_openai(
    prompt: str,
    model: str,
    temperature: float,
    max_tokens: int,
    top_p: float,
    top_k: Optional[int] = None,
):
    api_key = os.getenv("OPENAI_API_KEY")
    # In TESTING mode, return a deterministic stubbed response
    if os.getenv("TESTING") == "true":
        return "TESTING_OPENAI_RESPONSE"
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not found in environment variables")
    try:
        response = openai_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        error_msg = str(e)
        if "invalid_api_key" in error_msg.lower() or "401" in error_msg:
            raise HTTPException(
                status_code=401,
                detail="Invalid OpenAI API key. Please check your API key configuration.",
            )
        elif "quota" in error_msg.lower():
            raise HTTPException(
                status_code=429,
                detail="OpenAI API quota exceeded. Please check your usage limits.",
            )
        else:
            raise HTTPException(status_code=500, detail=f"OpenAI API error: {error_msg}")


async def call_llm(
    prompt: str,
    provider: str,
    model: str,
    temperature: float,
    max_tokens: int,
    top_p: float,
    top_k: Optional[int] = None,
):
    if provider == "ollama":
        return await call_ollama(prompt, model, temperature, max_tokens, top_p, top_k)
    elif provider == "openai":
        return await call_openai(prompt, model, temperature, max_tokens, top_p, top_k)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")


def evaluate_output(predicted: str, expected: str, method: str = "fuzzy") -> float:
    if method == "fuzzy":
        return difflib.SequenceMatcher(
            None, predicted.lower().strip(), expected.lower().strip()
        ).ratio()
    elif method == "exact":
        return 1.0 if predicted.lower().strip() == expected.lower().strip() else 0.0
    elif method == "semantic":
        predicted_words = set(predicted.lower().strip().split())
        expected_words = set(expected.lower().strip().split())
        if not expected_words:
            return 1.0 if not predicted_words else 0.0
        intersection = predicted_words.intersection(expected_words)
        union = predicted_words.union(expected_words)
        return len(intersection) / len(union) if union else 0.0
    elif method == "contains":
        return 1.0 if expected.lower().strip() in predicted.lower().strip() else 0.0
    else:
        return 0.0


