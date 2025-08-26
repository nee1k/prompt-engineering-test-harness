import asyncio
import difflib
import json
import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
import pandas as pd
import redis
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from app.db.session import engine, SessionLocal, Base
from app.models import (
    PromptSystem,
    TestRun,
    TestResult,
    TestSchedule,
    ModelComparison,
    ModelComparisonResult,
)
from app.services.scheduler import scheduler
from app.api.routers import prompt_systems as prompt_systems_router
from app.api.routers import test_runs as test_runs_router
from app.api.routers import test_schedules as test_schedules_router
from app.api.routers import model_comparisons as model_comparisons_router

load_dotenv()

# Initialize Redis client
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(redis_url, decode_responses=True)

app = FastAPI(title="Prompt Engineering Test Harness")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost",  # Nginx proxy
        "http://localhost:80",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Include routers (migrating incrementally)
app.include_router(prompt_systems_router.router)
app.include_router(test_runs_router.router)
app.include_router(test_schedules_router.router)
app.include_router(model_comparisons_router.router)


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
    evaluation_function: str = "fuzzy"  # "fuzzy", "exact", "semantic"


class TestScheduleCreate(BaseModel):
    prompt_system_id: str
    name: str
    regression_set: List[Dict[str, Any]]
    interval_seconds: int
    evaluation_function: str = "fuzzy"  # "fuzzy", "exact", "semantic", "contains"
    email_notifications: bool = False
    email_recipients: List[str] = []
    alert_threshold: float = 0.2


class ModelComparisonCreate(BaseModel):
    prompt_template: str
    template_variables: List[str]
    model_settings: Dict[str, Any]
    models: List[str]
    regression_set: List[Dict[str, Any]]
    evaluation_function: str = "fuzzy"


async def call_ollama(
    prompt: str,
    model: str,
    temperature: float,
    max_tokens: int,
    top_p: float,
    top_k: Optional[int] = None,
):
    """Call Ollama API"""
    # Use host.docker.internal when running in Docker, localhost otherwise
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
    """Call OpenAI API"""
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500, detail="OpenAI API key not found in environment variables"
        )

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
            raise HTTPException(
                status_code=500, detail=f"OpenAI API error: {error_msg}"
            )


async def call_llm(
    prompt: str,
    provider: str,
    model: str,
    temperature: float,
    max_tokens: int,
    top_p: float,
    top_k: Optional[int] = None,
):
    """Route LLM calls to appropriate provider"""
    if provider == "ollama":
        return await call_ollama(prompt, model, temperature, max_tokens, top_p, top_k)
    elif provider == "openai":
        return await call_openai(prompt, model, temperature, max_tokens, top_p, top_k)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")


@app.get("/")
async def root():
    return {"message": "Prompt Engineering Test Harness API"}


@app.get("/health/redis/")
async def redis_health_check():
    """Check Redis connection health"""
    try:
        redis_client.ping()
        return {"status": "healthy", "redis": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "redis": "disconnected", "error": str(e)}


@app.get("/models/")
async def get_available_models():
    """Get available models for both providers"""
    # Get actual available models from Ollama
    ollama_models = []
    try:
        ollama_host = os.getenv("OLLAMA_HOST", "host.docker.internal")
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"http://{ollama_host}:11434/api/tags", timeout=5.0
            )
            if response.status_code == 200:
                models_data = response.json()
                ollama_models = [
                    {"id": model["name"], "name": model["name"]}
                    for model in models_data.get("models", [])
                ]
    except Exception as e:
        # Fallback to empty list if Ollama is not available
        pass

    return {
        "openai": [
            {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo"},
            {"id": "gpt-4", "name": "GPT-4"},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo"},
        ],
        "ollama": ollama_models,
    }


@app.get("/ollama/status/")
async def check_ollama_status():
    """Check if Ollama is running and get available models"""
    # Use host.docker.internal when running in Docker, localhost otherwise
    ollama_host = os.getenv("OLLAMA_HOST", "host.docker.internal")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"http://{ollama_host}:11434/api/tags", timeout=5.0
            )
            response.raise_for_status()
            models = response.json()
            return {
                "status": "running",
                "models": [model["name"] for model in models.get("models", [])],
            }
    except Exception as e:
        return {"status": "not_running", "error": str(e), "models": []}


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
            created_at=datetime.utcnow(),
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
        prompt_system = (
            db.query(PromptSystem).filter(PromptSystem.id == prompt_system_id).first()
        )
        if not prompt_system:
            raise HTTPException(status_code=404, detail="Prompt system not found")
        return prompt_system
    finally:
        db.close()


@app.post("/upload-regression-set/")
async def upload_regression_set(file: UploadFile = File(...)):
    if not file.filename.endswith((".csv", ".jsonl")):
        raise HTTPException(status_code=400, detail="File must be CSV or JSONL")

    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(file.file)
            regression_set = df.to_dict("records")
        else:  # JSONL
            content = await file.read()
            lines = content.decode().strip().split("\n")
            regression_set = [json.loads(line) for line in lines if line.strip()]

        return {"regression_set": regression_set}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")


def evaluate_output(predicted: str, expected: str, method: str = "fuzzy") -> float:
    """Evaluate output using different methods"""
    if method == "fuzzy":
        # Fuzzy string matching using sequence matcher
        return difflib.SequenceMatcher(
            None, predicted.lower().strip(), expected.lower().strip()
        ).ratio()
    elif method == "exact":
        # Exact string match (case-insensitive)
        return 1.0 if predicted.lower().strip() == expected.lower().strip() else 0.0
    elif method == "semantic":
        # Semantic similarity using word overlap
        predicted_words = set(predicted.lower().strip().split())
        expected_words = set(expected.lower().strip().split())
        if not expected_words:
            return 1.0 if not predicted_words else 0.0
        intersection = predicted_words.intersection(expected_words)
        union = predicted_words.union(expected_words)
        return len(intersection) / len(union) if union else 0.0
    elif method == "contains":
        # Check if expected output is contained in predicted output
        return 1.0 if expected.lower().strip() in predicted.lower().strip() else 0.0
    else:
        return 0.0


@app.post("/test-runs/")
async def create_test_run(test_run: TestRunCreate):
    db = SessionLocal()
    try:
        # Get prompt system
        prompt_system = (
            db.query(PromptSystem)
            .filter(PromptSystem.id == test_run.prompt_system_id)
            .first()
        )
        if not prompt_system:
            raise HTTPException(status_code=404, detail="Prompt system not found")

        # Process all samples first before creating any database records
        results = []
        total_score = 0

        for i, sample in enumerate(test_run.regression_set):
            # Extract variables and expected output
            variables = {k: v for k, v in sample.items() if k != "expected_output"}
            expected_output = sample.get("expected_output", "")

            # Interpolate template
            try:
                prompt = prompt_system.template.format(**variables)
            except KeyError as e:
                raise HTTPException(
                    status_code=400, detail=f"Missing variable in sample {i}: {e}"
                )

            # Call LLM
            predicted_output = await call_llm(
                prompt=prompt,
                provider=prompt_system.provider,
                model=prompt_system.model,
                temperature=prompt_system.temperature,
                max_tokens=prompt_system.max_tokens,
                top_p=prompt_system.top_p,
                top_k=prompt_system.top_k,
            )

            # Evaluate
            score = evaluate_output(
                predicted_output, expected_output, test_run.evaluation_function
            )
            total_score += score

            results.append(
                {
                    "sample_id": str(i),
                    "input_variables": variables,
                    "expected_output": expected_output,
                    "predicted_output": predicted_output,
                    "score": score,
                    "evaluation_method": test_run.evaluation_function,
                }
            )

        # Only create database records after all samples are processed successfully
        test_run_id = str(uuid.uuid4())
        db_test_run = TestRun(
            id=test_run_id,
            prompt_system_id=test_run.prompt_system_id,
            created_at=datetime.utcnow(),
        )
        db.add(db_test_run)

        # Store all results
        for result in results:
            db_result = TestResult(
                id=str(uuid.uuid4()),
                test_run_id=test_run_id,
                sample_id=result["sample_id"],
                input_variables=json.dumps(result["input_variables"]),
                expected_output=result["expected_output"],
                predicted_output=result["predicted_output"],
                score=result["score"],
                evaluation_method=result["evaluation_method"],
            )
            db.add(db_result)

        # Update test run with aggregate metrics
        avg_score = (
            total_score / len(test_run.regression_set) if test_run.regression_set else 0
        )
        db_test_run.avg_score = avg_score
        db_test_run.total_samples = len(test_run.regression_set)

        # Commit everything at once
        db.commit()

        return {
            "test_run_id": test_run_id,
            "avg_score": avg_score,
            "total_samples": len(test_run.regression_set),
            "results": results,
        }

    except HTTPException:
        # Re-raise HTTPExceptions (like API key errors) without wrapping them
        db.rollback()
        raise
    except Exception as e:
        # Rollback any database changes if an error occurs
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Test run failed: {str(e)}")
    finally:
        db.close()


@app.get("/test-runs/{test_run_id}")
async def get_test_run(test_run_id: str):
    """
    Get a test run by ID

    Args:
        test_run_id: The ID of the test run to retrieve

    Returns:
        A dictionary containing the test run and its results
    """
    db = SessionLocal()
    try:
        test_run = (
            db.query(TestRun)
            .options(joinedload(TestRun.prompt_system))
            .filter(TestRun.id == test_run_id)
            .first()
        )
        if not test_run:
            raise HTTPException(status_code=404, detail="Test run not found")

        results = db.query(TestResult).filter(TestResult.test_run_id == test_run_id).all()
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Test run results: {results}")
        
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
        test_runs = (
            db.query(TestRun)
            .options(joinedload(TestRun.prompt_system))
            .order_by(TestRun.created_at.desc())
            .all()
        )
        return test_runs
    finally:
        db.close()


@app.get("/evaluation-functions/")
async def get_evaluation_functions():
    """Get available evaluation functions"""
    return {
        "evaluation_functions": [
            {
                "id": "fuzzy",
                "name": "Fuzzy Match",
                "description": "Fuzzy string matching using sequence similarity",
            },
            {
                "id": "exact",
                "name": "Exact Match",
                "description": "Exact string match (case-insensitive)",
            },
            {
                "id": "semantic",
                "name": "Semantic Similarity",
                "description": "Word overlap similarity (Jaccard index)",
            },
            {
                "id": "contains",
                "name": "Contains",
                "description": "Check if expected output is contained in predicted output",
            },
        ]
    }


# Test Schedule endpoints
@app.post("/test-schedules/")
async def create_test_schedule(schedule: TestScheduleCreate):
    db = SessionLocal()
    try:
        # Verify prompt system exists
        prompt_system = (
            db.query(PromptSystem)
            .filter(PromptSystem.id == schedule.prompt_system_id)
            .first()
        )
        if not prompt_system:
            raise HTTPException(status_code=404, detail="Prompt system not found")

        # Create schedule
        schedule_id = str(uuid.uuid4())
        db_schedule = TestSchedule(
            id=schedule_id,
            prompt_system_id=schedule.prompt_system_id,
            name=schedule.name,
            regression_set=json.dumps(schedule.regression_set),
            interval_hours=schedule.interval_seconds
            // 60,  # Convert seconds to minutes for storage
            evaluation_function=schedule.evaluation_function,
            email_notifications=schedule.email_notifications,
            email_recipients=(
                json.dumps(schedule.email_recipients)
                if schedule.email_recipients
                else None
            ),
            alert_threshold=schedule.alert_threshold,
            is_active=True,
            next_run_at=datetime.utcnow(),
        )
        db.add(db_schedule)
        db.commit()

        # Add to scheduler
        await scheduler.add_schedule(schedule_id, schedule.interval_seconds)

        return db_schedule
    finally:
        db.close()


@app.get("/test-schedules/")
async def get_test_schedules():
    db = SessionLocal()
    try:
        schedules = (
            db.query(TestSchedule)
            .options(joinedload(TestSchedule.prompt_system))
            .order_by(TestSchedule.created_at.desc())
            .all()
        )
        return schedules
    finally:
        db.close()


@app.put("/test-schedules/{schedule_id}/toggle")
async def toggle_test_schedule(schedule_id: str):
    db = SessionLocal()
    try:
        schedule = db.query(TestSchedule).filter(TestSchedule.id == schedule_id).first()
        if not schedule:
            raise HTTPException(status_code=404, detail="Test schedule not found")

        schedule.is_active = not schedule.is_active

        if schedule.is_active:
            await scheduler.add_schedule(
                schedule_id, schedule.interval_hours * 60
            )  # Convert minutes to seconds for scheduler
        else:
            await scheduler.remove_schedule(schedule_id)

        db.commit()
        return schedule
    finally:
        db.close()


@app.delete("/test-schedules/{schedule_id}")
async def delete_test_schedule(schedule_id: str):
    db = SessionLocal()
    try:
        schedule = db.query(TestSchedule).filter(TestSchedule.id == schedule_id).first()
        if not schedule:
            raise HTTPException(status_code=404, detail="Test schedule not found")

        await scheduler.remove_schedule(schedule_id)
        db.delete(schedule)
        db.commit()
        return {"message": "Schedule deleted"}
    finally:
        db.close()


# Model comparison endpoints
@app.post("/model-comparisons/")
async def create_model_comparison(comparison: ModelComparisonCreate):
    db = SessionLocal()
    try:
        # Create the comparison record
        comparison_id = str(uuid.uuid4())
        db_comparison = ModelComparison(
            id=comparison_id,
            prompt_system_id=None,  # No prompt system ID for direct template comparison
            prompt_template=comparison.prompt_template,
            template_variables=json.dumps(comparison.template_variables),
            model_settings=json.dumps(comparison.model_settings),
            models=json.dumps(comparison.models),
            regression_set=json.dumps(comparison.regression_set),
            evaluation_function=comparison.evaluation_function,
        )
        db.add(db_comparison)
        db.commit()

        results = []

        # Run tests for each model
        for model_id in comparison.models:
            try:
                # Determine provider based on model ID
                provider = "openai" if model_id.startswith("gpt-") else "ollama"

                # Run the test
                total_score = 0
                total_samples = len(comparison.regression_set)

                for sample in comparison.regression_set:
                    # Format the prompt with variables
                    prompt = comparison.prompt_template
                    for var in comparison.template_variables:
                        if var in sample:
                            prompt = prompt.replace(f"{{{var}}}", str(sample[var]))

                    # Call the appropriate API
                    if provider == "openai":
                        response = await call_openai(
                            prompt,
                            model_id,
                            comparison.model_settings.get("temperature", 0.7),
                            comparison.model_settings.get("max_tokens", 1000),
                            comparison.model_settings.get("top_p", 1.0),
                            comparison.model_settings.get("top_k"),
                        )
                    else:
                        response = await call_ollama(
                            prompt,
                            model_id,
                            comparison.model_settings.get("temperature", 0.7),
                            comparison.model_settings.get("max_tokens", 1000),
                            comparison.model_settings.get("top_p", 1.0),
                            comparison.model_settings.get("top_k"),
                        )

                    # Evaluate the response
                    score = evaluate_output(
                        response,
                        sample.get("expected_output", ""),
                        comparison.evaluation_function,
                    )
                    total_score += score

                avg_score = total_score / total_samples if total_samples > 0 else 0

                # Save the result
                result = ModelComparisonResult(
                    id=str(uuid.uuid4()),
                    model_comparison_id=comparison_id,
                    model=model_id,
                    provider=provider,
                    avg_score=avg_score,
                    total_samples=total_samples,
                    status="completed",
                )
                db.add(result)
                results.append(
                    {
                        "model": model_id,
                        "provider": provider,
                        "avg_score": avg_score,
                        "total_samples": total_samples,
                        "status": "completed",
                    }
                )

            except Exception as e:
                # Save failed result
                result = ModelComparisonResult(
                    id=str(uuid.uuid4()),
                    model_comparison_id=comparison_id,
                    model=model_id,
                    provider=provider if "provider" in locals() else "unknown",
                    avg_score=0.0,
                    total_samples=0,
                    status="failed",
                )
                db.add(result)
                results.append(
                    {
                        "model": model_id,
                        "provider": provider if "provider" in locals() else "unknown",
                        "avg_score": 0.0,
                        "total_samples": 0,
                        "status": "failed",
                    }
                )

        db.commit()
        return {"id": comparison_id, "results": results}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.get("/model-comparisons/")
async def get_model_comparisons():
    db = SessionLocal()
    try:
        comparisons = (
            db.query(ModelComparison).order_by(ModelComparison.created_at.desc()).all()
        )
        result = []

        for comparison in comparisons:
            results = (
                db.query(ModelComparisonResult)
                .filter(ModelComparisonResult.model_comparison_id == comparison.id)
                .all()
            )

            result.append(
                {
                    "id": comparison.id,
                    "prompt_system_id": comparison.prompt_system_id,
                    "prompt_template": comparison.prompt_template,
                    "template_variables": (
                        json.loads(comparison.template_variables)
                        if comparison.template_variables
                        else []
                    ),
                    "model_settings": (
                        json.loads(comparison.model_settings)
                        if comparison.model_settings
                        else {}
                    ),
                    "models": json.loads(comparison.models),
                    "regression_set": json.loads(comparison.regression_set),
                    "evaluation_function": comparison.evaluation_function,
                    "created_at": comparison.created_at,
                    "results": [
                        {
                            "model": r.model,
                            "provider": r.provider,
                            "avg_score": r.avg_score,
                            "total_samples": r.total_samples,
                            "status": r.status,
                        }
                        for r in results
                    ],
                }
            )

        return result
    finally:
        db.close()


# Time-series data endpoint
@app.get("/test-runs/{prompt_system_id}/history")
async def get_test_run_history(prompt_system_id: str, days: int = 7):
    db = SessionLocal()
    try:
        from datetime import timedelta

        cutoff_date = datetime.utcnow() - timedelta(days=days)

        test_runs = (
            db.query(TestRun)
            .filter(
                TestRun.prompt_system_id == prompt_system_id,
                TestRun.created_at >= cutoff_date,
            )
            .order_by(TestRun.created_at.asc())
            .all()
        )

        history = []
        for run in test_runs:
            history.append(
                {
                    "id": run.id,
                    "created_at": run.created_at,
                    "avg_score": run.avg_score,
                    "total_samples": run.total_samples,
                    "is_scheduled": run.test_schedule_id is not None,
                }
            )

        return history
    finally:
        db.close()


# AI Prompt Optimizer endpoints
class PromptOptimizerCreate(BaseModel):
    promptSystemId: str
    config: Dict[str, Any]


# Redis-based optimization sessions storage
OPTIMIZATION_SESSION_PREFIX = "optimization_session:"


def get_optimization_session(optimization_id: str) -> Dict[str, Any]:
    """Get optimization session from Redis"""
    try:
        session_data = redis_client.get(
            f"{OPTIMIZATION_SESSION_PREFIX}{optimization_id}"
        )
        return json.loads(session_data) if session_data else None
    except Exception as e:
        print(f"Error getting optimization session from Redis: {e}")
        return None


def set_optimization_session(
    optimization_id: str, session_data: Dict[str, Any]
) -> bool:
    """Set optimization session in Redis"""
    try:
        # Store with 24-hour expiration
        redis_client.setex(
            f"{OPTIMIZATION_SESSION_PREFIX}{optimization_id}",
            86400,  # 24 hours
            json.dumps(session_data, default=str),
        )
        return True
    except Exception as e:
        print(f"Error setting optimization session in Redis: {e}")
        return False


def delete_optimization_session(optimization_id: str) -> bool:
    """Delete optimization session from Redis"""
    try:
        redis_client.delete(f"{OPTIMIZATION_SESSION_PREFIX}{optimization_id}")
        return True
    except Exception as e:
        print(f"Error deleting optimization session from Redis: {e}")
        return False


def cleanup_old_sessions():
    """Clean up completed/failed sessions older than 24 hours"""
    try:
        session_keys = redis_client.keys(f"{OPTIMIZATION_SESSION_PREFIX}*")
        cleaned_count = 0

        for key in session_keys:
            optimization_id = key.replace(OPTIMIZATION_SESSION_PREFIX, "")
            session = get_optimization_session(optimization_id)
            if session:
                # Check if session is completed/failed and older than 24 hours
                if session["status"] in ["completed", "failed"]:
                    start_time = datetime.fromisoformat(session["start_time"])
                    if (
                        datetime.utcnow() - start_time
                    ).total_seconds() > 86400:  # 24 hours
                        delete_optimization_session(optimization_id)
                        cleaned_count += 1

        if cleaned_count > 0:
            print(f"Cleaned up {cleaned_count} old optimization sessions")
    except Exception as e:
        print(f"Error cleaning up old sessions: {e}")


@app.post("/prompt-optimizer/start")
async def start_prompt_optimization(request: PromptOptimizerCreate):
    """Start an AI prompt optimization session"""
    optimization_id = str(uuid.uuid4())

    # Get the prompt system
    db = SessionLocal()
    try:
        prompt_system = (
            db.query(PromptSystem)
            .filter(PromptSystem.id == request.promptSystemId)
            .first()
        )
        if not prompt_system:
            raise HTTPException(status_code=404, detail="Prompt system not found")

        # Get the latest test run for baseline
        latest_test_run = (
            db.query(TestRun)
            .filter(TestRun.prompt_system_id == request.promptSystemId)
            .order_by(TestRun.created_at.desc())
            .first()
        )

        if not latest_test_run:
            raise HTTPException(
                status_code=400, detail="No test runs found for this prompt system"
            )

        # Initialize optimization session
        session_data = {
            "status": "running",
            "prompt_system_id": request.promptSystemId,
            "config": request.config,
            "current_iteration": 0,
            "total_cost": 0.0,
            "baseline_score": latest_test_run.avg_score,
            "best_score": latest_test_run.avg_score,
            "best_prompt": prompt_system.template,
            "results": [],
            "start_time": datetime.utcnow().isoformat(),
        }

        if not set_optimization_session(optimization_id, session_data):
            raise HTTPException(
                status_code=500, detail="Failed to initialize optimization session"
            )

        # Start optimization in background
        asyncio.create_task(run_optimization(optimization_id))

        return {"optimizationId": optimization_id, "status": "started"}

    finally:
        db.close()


async def run_optimization(optimization_id: str):
    """Run the optimization process"""
    session = get_optimization_session(optimization_id)
    if not session:
        print(f"Optimization session {optimization_id} not found")
        return

    db = SessionLocal()

    try:
        prompt_system = (
            db.query(PromptSystem)
            .filter(PromptSystem.id == session["prompt_system_id"])
            .first()
        )

        for iteration in range(session["config"]["maxIterations"]):
            if session["status"] != "running":
                break

            session["current_iteration"] = iteration + 1
            set_optimization_session(optimization_id, session)

            # Get the latest test run for regression set
            latest_test_run = (
                db.query(TestRun)
                .filter(TestRun.prompt_system_id == session["prompt_system_id"])
                .order_by(TestRun.created_at.desc())
                .first()
            )

            if not latest_test_run:
                break

            # Get test results for analysis
            test_results = (
                db.query(TestResult)
                .filter(TestResult.test_run_id == latest_test_run.id)
                .all()
            )

            # Reconstruct regression set from test results
            regression_set = []
            for result in test_results:
                input_vars = (
                    json.loads(result.input_variables) if result.input_variables else {}
                )
                regression_set.append(
                    {**input_vars, "expected_output": result.expected_output}
                )

            # Analyze failures and generate improvement prompt
            improvement_prompt = generate_improvement_prompt(
                prompt_system.template,
                test_results,
                session["config"]["evaluationMethod"],
            )

            # Get improved prompt from LLM
            improved_prompt = await get_improved_prompt(improvement_prompt)

            # Check if we got an empty prompt (indicating an error)
            error_message = None
            if not improved_prompt:
                error_message = "Failed to generate improved prompt. This is likely due to an invalid OpenAI API key. Please check your API key configuration."

            # Test the improved prompt
            test_score = await test_improved_prompt(
                improved_prompt,
                prompt_system,
                regression_set,
                session["config"]["evaluationMethod"],
            )

            # Update session
            improvement = test_score - session["best_score"]
            session["total_cost"] += 0.01  # Rough cost estimate per iteration

            result = {
                "iteration": iteration + 1,
                "prompt": improved_prompt,
                "score": test_score,
                "improvement": improvement,
                "cost": session["total_cost"],
                "error": error_message,
            }

            session["results"].append(result)

            # Update best if improved
            if test_score > session["best_score"]:
                session["best_score"] = test_score
                session["best_prompt"] = improved_prompt

            # Save updated session to Redis
            set_optimization_session(optimization_id, session)

            # Check budget limits
            if session["total_cost"] >= session["config"]["costBudget"]:
                break

            # Small delay between iterations
            await asyncio.sleep(2)

        session["status"] = "completed"
        set_optimization_session(optimization_id, session)

    except Exception as e:
        session["status"] = "failed"
        session["error"] = str(e)
        set_optimization_session(optimization_id, session)
    finally:
        db.close()


def generate_improvement_prompt(
    original_prompt: str, test_results: List[TestResult], evaluation_method: str
):
    """Generate a prompt to improve the original prompt based on test results"""

    # Analyze test results to find patterns in failures
    failed_results = [
        r for r in test_results if r.score < 0.8
    ]  # Consider scores below 0.8 as failures

    if not failed_results:
        return f"""The following prompt is working well, but we want to make it even better. 
        Please suggest a slightly improved version that might be more clear, specific, or effective:

        Original prompt: {original_prompt}

        Please provide an improved version that maintains the same structure but enhances clarity, specificity, or effectiveness."""

    # Analyze failure patterns
    failure_analysis = []
    for result in failed_results[:5]:  # Look at top 5 failures
        input_vars = (
            json.loads(result.input_variables) if result.input_variables else {}
        )
        failure_analysis.append(
            f"Input: {input_vars}, Expected: {result.expected_output}, Got: {result.predicted_output}, Score: {result.score}"
        )

    return f"""The following prompt needs improvement. Here are some examples where it failed:

        Original prompt: {original_prompt}

        Failed examples:
        {chr(10).join(failure_analysis)}

        Please provide an improved version of the prompt that addresses these failure patterns. 
        The improved prompt should:
        1. Be more specific about what output is expected
        2. Handle edge cases better
        3. Be clearer and more unambiguous
        4. Maintain the same basic structure and variables

        Please return only the improved prompt, nothing else. Do not include 'improved prompt' at the beginning."""


async def get_improved_prompt(improvement_prompt: str) -> str:
    """Get an improved prompt from the LLM"""
    try:
        # Use the improved call_openai function for better error handling
        system_message = "You are an expert prompt engineer. Provide clear, specific, and effective prompt improvements."
        full_prompt = f"{system_message}\n\n{improvement_prompt}"

        return await call_openai(
            prompt=full_prompt,
            model="gpt-4",
            temperature=0.7,
            max_tokens=500,
            top_p=1.0,
        )
    except HTTPException as e:
        print(f"Error getting improved prompt: {e.detail}")
        return ""
    except Exception as e:
        print(f"Error getting improved prompt: {str(e)}")
        return ""


async def test_improved_prompt(
    improved_prompt: str,
    prompt_system: PromptSystem,
    regression_set: List[Dict],
    evaluation_method: str,
) -> float:
    """Test the improved prompt and return the average score"""
    try:
        scores = []

        for test_case in regression_set[:10]:  # Test with first 10 cases for speed
            # Format the prompt with test case variables
            formatted_prompt = improved_prompt
            for key, value in test_case.items():
                if key != "expected_output":
                    formatted_prompt = formatted_prompt.replace(
                        f"{{{key}}}", str(value)
                    )

            # Call the LLM using the improved call_openai function
            predicted_output = await call_llm(
                prompt=formatted_prompt,
                provider=prompt_system.provider,
                model=prompt_system.model,
                temperature=prompt_system.temperature,
                max_tokens=prompt_system.max_tokens,
                top_p=prompt_system.top_p,
                top_k=prompt_system.top_k,
            )

            # Evaluate the result
            score = evaluate_output(
                predicted_output, test_case["expected_output"], evaluation_method
            )
            scores.append(score)

        avg_score = sum(scores) / len(scores) if scores else 0.0
        return avg_score

    except HTTPException as e:
        print(f"Error testing improved prompt: {e.detail}")
        return 0.0
    except Exception as e:
        print(f"Error testing improved prompt: {str(e)}")
        return 0.0


@app.get("/prompt-optimizer/{optimization_id}/status")
async def get_optimization_status(optimization_id: str):
    """Get the status of an optimization session"""
    session = get_optimization_session(optimization_id)
    if not session:
        raise HTTPException(status_code=404, detail="Optimization session not found")

    return {
        "status": session["status"],
        "currentIteration": session["current_iteration"],
        "totalCost": session["total_cost"],
        "baselineScore": session["baseline_score"],
        "bestScore": session["best_score"],
        "results": session["results"],
    }


@app.post("/prompt-optimizer/stop")
async def stop_optimization():
    """Stop all running optimizations"""
    try:
        # Get all optimization session keys
        session_keys = redis_client.keys(f"{OPTIMIZATION_SESSION_PREFIX}*")
        stopped_count = 0

        for key in session_keys:
            optimization_id = key.replace(OPTIMIZATION_SESSION_PREFIX, "")
            session = get_optimization_session(optimization_id)
            if session and session["status"] == "running":
                session["status"] = "stopped"
                set_optimization_session(optimization_id, session)
                stopped_count += 1

        return {"status": "stopped", "stopped_sessions": stopped_count}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error stopping optimizations: {str(e)}"
        )


@app.get("/prompt-optimizer/sessions/")
async def list_optimization_sessions():
    """List all optimization sessions"""
    try:
        session_keys = redis_client.keys(f"{OPTIMIZATION_SESSION_PREFIX}*")
        sessions = []

        for key in session_keys:
            optimization_id = key.replace(OPTIMIZATION_SESSION_PREFIX, "")
            session = get_optimization_session(optimization_id)
            if session:
                sessions.append(
                    {
                        "id": optimization_id,
                        "status": session["status"],
                        "prompt_system_id": session["prompt_system_id"],
                        "current_iteration": session["current_iteration"],
                        "total_cost": session["total_cost"],
                        "best_score": session["best_score"],
                        "start_time": session["start_time"],
                    }
                )

        return {"sessions": sessions}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error listing optimization sessions: {str(e)}"
        )


@app.delete("/prompt-optimizer/{optimization_id}/")
async def delete_optimization_session_endpoint(optimization_id: str):
    """Delete a specific optimization session"""
    try:
        session = get_optimization_session(optimization_id)
        if not session:
            raise HTTPException(
                status_code=404, detail="Optimization session not found"
            )

        if delete_optimization_session(optimization_id):
            return {
                "status": "deleted",
                "message": f"Optimization session {optimization_id} deleted",
            }
        else:
            raise HTTPException(
                status_code=500, detail="Failed to delete optimization session"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error deleting optimization session: {str(e)}"
        )


# Initialize scheduler on startup
@app.on_event("startup")
async def startup_event():
    # Test Redis connection
    try:
        redis_client.ping()
        print("✓ Redis connection established")
        # Clean up old sessions on startup
        cleanup_old_sessions()
    except Exception as e:
        print(f"⚠ Redis connection failed: {e}")
        print("Optimization sessions will not persist across restarts")
    # Run database migrations unless in test mode
    if os.getenv("TESTING") != "true":
        try:
            from app.migrations.m001_initial import run_migration
            run_migration()
        except Exception as e:
            print(f"Migration warning: {e}")
            pass

        # Run evaluation function migration
        try:
            from app.migrations.m002_evaluation_function import migrate_evaluation_function
            migrate_evaluation_function()
        except Exception:
            pass

        # Run email notification migration
        try:
            from app.migrations.m003_email_notifications import migrate_email_notifications
            migrate_email_notifications()
        except Exception:
            pass

        # Run model comparison migration
        try:
            from app.migrations.m004_model_comparison import run_migration
            run_migration()
        except Exception:
            pass

        # Run model comparison v2 migration
        try:
            from app.migrations.m005_model_comparison_v2 import run_migration
            run_migration()
        except Exception:
            pass
    # Load existing schedules
    await scheduler.load_existing_schedules()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
