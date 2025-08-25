import uuid


def make_prompt_system_payload():
    return {
        "name": f"System-{uuid.uuid4().hex[:6]}",
        "template": "Translate {text} to {language}",
        "variables": ["text", "language"],
        "provider": "openai",
        "model": "gpt-3.5-turbo",
        "temperature": 0.7,
        "max_tokens": 1000,
        "top_p": 1.0,
        "top_k": None,
    }

