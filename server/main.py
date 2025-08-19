from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import pandas as pd
import difflib
import openai
import os
import httpx
from dotenv import load_dotenv
from database import engine, SessionLocal
from models import Base, PromptSystem, TestRun, TestResult
import uuid
from datetime import datetime

load_dotenv()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI(title="Emissary - Prompt System Monitor")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

class PromptSystemCreate(BaseModel):
    name: str
    template: str
    variables: List[str]
    provider: str = "openai"  # "openai" or "ollama"
    model: str = "gpt-3.5-turbo"
    temperature: float = 0.7
    max_tokens: int = 1000
    top_p: float = 1.0
    top_k: Optional[int] = None

class TestRunCreate(BaseModel):
    prompt_system_id: str
    regression_set: List[Dict[str, Any]]

class EvaluationResult(BaseModel):
    sample_id: str
    input_variables: Dict[str, Any]
    expected_output: str
    predicted_output: str
    score: float
    evaluation_method: str

async def call_ollama(prompt: str, model: str, temperature: float, max_tokens: int, top_p: float, top_k: Optional[int] = None):
    """Call Ollama API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "options": {
                        "temperature": temperature,
                        "top_p": top_p,
                        "top_k": top_k,
                        "num_predict": max_tokens
                    },
                    "stream": False
                },
                timeout=60.0
            )
            response.raise_for_status()
            result = response.json()
            return result.get("response", "").strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama API error: {str(e)}")

async def call_openai(prompt: str, model: str, temperature: float, max_tokens: int, top_p: float, top_k: Optional[int] = None):
    """Call OpenAI API"""
    try:
        response = openai.ChatCompletion.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p,
            top_k=top_k
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")

async def call_llm(prompt: str, provider: str, model: str, temperature: float, max_tokens: int, top_p: float, top_k: Optional[int] = None):
    """Route LLM calls to appropriate provider"""
    if provider == "ollama":
        return await call_ollama(prompt, model, temperature, max_tokens, top_p, top_k)
    elif provider == "openai":
        return await call_openai(prompt, model, temperature, max_tokens, top_p, top_k)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

@app.get("/")
async def root():
    return {"message": "Emissary Prompt System Monitor API"}

@app.get("/models/")
async def get_available_models():
    """Get available models for both providers"""
    return {
        "openai": [
            {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo"},
            {"id": "gpt-4", "name": "GPT-4"},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo"}
        ],
        "ollama": [
            {"id": "llama3:8b", "name": "Llama 3 8B"},
            {"id": "llama3:70b", "name": "Llama 3 70B"},
            {"id": "mistral:7b", "name": "Mistral 7B"},
            {"id": "phi3:mini", "name": "Phi-3 Mini"},
            {"id": "qwen2.5:7b", "name": "Qwen 2.5 7B"},
            {"id": "codellama:7b", "name": "Code Llama 7B"}
        ]
    }

@app.get("/ollama/status/")
async def check_ollama_status():
    """Check if Ollama is running and get available models"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:11434/api/tags", timeout=5.0)
            response.raise_for_status()
            models = response.json()
            return {
                "status": "running",
                "models": [model["name"] for model in models.get("models", [])]
            }
    except Exception as e:
        return {
            "status": "not_running",
            "error": str(e),
            "models": []
        }

@app.post("/prompt-systems/")
async def create_prompt_system(prompt_system: PromptSystemCreate):
    db = SessionLocal()
    try:
        db_prompt_system = PromptSystem(
            id=str(uuid.uuid4()),
            name=prompt_system.name,
            template=prompt_system.template,
            variables=json.dumps(prompt_system.variables),
            provider=prompt_system.provider,
            model=prompt_system.model,
            temperature=prompt_system.temperature,
            max_tokens=prompt_system.max_tokens,
            top_p=prompt_system.top_p,
            top_k=prompt_system.top_k,
            created_at=datetime.utcnow()
        )
        db.add(db_prompt_system)
        db.commit()
        db.refresh(db_prompt_system)
        return db_prompt_system
    finally:
        db.close()

@app.get("/prompt-systems/")
async def get_prompt_systems():
    db = SessionLocal()
    try:
        prompt_systems = db.query(PromptSystem).all()
        return prompt_systems
    finally:
        db.close()

@app.get("/prompt-systems/{prompt_system_id}")
async def get_prompt_system(prompt_system_id: str):
    db = SessionLocal()
    try:
        prompt_system = db.query(PromptSystem).filter(PromptSystem.id == prompt_system_id).first()
        if not prompt_system:
            raise HTTPException(status_code=404, detail="Prompt system not found")
        return prompt_system
    finally:
        db.close()

@app.post("/upload-regression-set/")
async def upload_regression_set(file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.jsonl')):
        raise HTTPException(status_code=400, detail="File must be CSV or JSONL")
    
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file.file)
            regression_set = df.to_dict('records')
        else:  # JSONL
            content = await file.read()
            lines = content.decode().strip().split('\n')
            regression_set = [json.loads(line) for line in lines if line.strip()]
        
        return {"regression_set": regression_set}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")

def evaluate_output(predicted: str, expected: str, method: str = "fuzzy") -> float:
    """Simple evaluation function using fuzzy string matching"""
    if method == "fuzzy":
        return difflib.SequenceMatcher(None, predicted.lower(), expected.lower()).ratio()
    elif method == "exact":
        return 1.0 if predicted.strip() == expected.strip() else 0.0
    else:
        return 0.0

@app.post("/test-runs/")
async def create_test_run(test_run: TestRunCreate):
    db = SessionLocal()
    try:
        # Get prompt system
        prompt_system = db.query(PromptSystem).filter(PromptSystem.id == test_run.prompt_system_id).first()
        if not prompt_system:
            raise HTTPException(status_code=404, detail="Prompt system not found")
        
        # Create test run
        test_run_id = str(uuid.uuid4())
        db_test_run = TestRun(
            id=test_run_id,
            prompt_system_id=test_run.prompt_system_id,
            created_at=datetime.utcnow()
        )
        db.add(db_test_run)
        db.commit()
        
        # Process each sample
        results = []
        total_score = 0
        
        for i, sample in enumerate(test_run.regression_set):
            # Extract variables and expected output
            variables = {k: v for k, v in sample.items() if k != 'expected_output'}
            expected_output = sample.get('expected_output', '')
            
            # Interpolate template
            try:
                prompt = prompt_system.template.format(**variables)
            except KeyError as e:
                raise HTTPException(status_code=400, detail=f"Missing variable in sample {i}: {e}")
            
            # Call LLM
            predicted_output = await call_llm(
                prompt=prompt,
                provider=prompt_system.provider,
                model=prompt_system.model,
                temperature=prompt_system.temperature,
                max_tokens=prompt_system.max_tokens,
                top_p=prompt_system.top_p,
                top_k=prompt_system.top_k
            )
            
            # Evaluate
            score = evaluate_output(predicted_output, expected_output)
            total_score += score
            
            # Store result
            db_result = TestResult(
                id=str(uuid.uuid4()),
                test_run_id=test_run_id,
                sample_id=str(i),
                input_variables=json.dumps(variables),
                expected_output=expected_output,
                predicted_output=predicted_output,
                score=score,
                evaluation_method="fuzzy"
            )
            db.add(db_result)
            
            results.append({
                "sample_id": str(i),
                "input_variables": variables,
                "expected_output": expected_output,
                "predicted_output": predicted_output,
                "score": score,
                "evaluation_method": "fuzzy"
            })
        
        # Update test run with aggregate metrics
        avg_score = total_score / len(test_run.regression_set) if test_run.regression_set else 0
        db_test_run.avg_score = avg_score
        db_test_run.total_samples = len(test_run.regression_set)
        db.commit()
        
        return {
            "test_run_id": test_run_id,
            "avg_score": avg_score,
            "total_samples": len(test_run.regression_set),
            "results": results
        }
        
    finally:
        db.close()

@app.get("/test-runs/{test_run_id}")
async def get_test_run(test_run_id: str):
    db = SessionLocal()
    try:
        test_run = db.query(TestRun).filter(TestRun.id == test_run_id).first()
        if not test_run:
            raise HTTPException(status_code=404, detail="Test run not found")
        
        results = db.query(TestResult).filter(TestResult.test_run_id == test_run_id).all()
        
        return {
            "test_run": test_run,
            "results": results
        }
    finally:
        db.close()

@app.get("/test-runs/")
async def get_test_runs():
    db = SessionLocal()
    try:
        test_runs = db.query(TestRun).order_by(TestRun.created_at.desc()).all()
        return test_runs
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
