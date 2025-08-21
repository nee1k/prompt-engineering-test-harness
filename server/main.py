from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import pandas as pd
import difflib
from openai import OpenAI
import os
import httpx
from dotenv import load_dotenv
from database import engine, SessionLocal
from models import Base, PromptSystem, TestRun, TestResult, TestSchedule, ModelComparison, ModelComparisonResult
from sqlalchemy.orm import joinedload
import uuid
from datetime import datetime
from scheduler import scheduler

load_dotenv()

# Initialize OpenAI client
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI(title="Prompt Engineering Test Harness")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173",
        "http://localhost",  # Nginx proxy
        "http://localhost:80"
    ],
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



async def call_ollama(prompt: str, model: str, temperature: float, max_tokens: int, top_p: float, top_k: Optional[int] = None):
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
        # Debug: Check if API key is set
        api_key = os.getenv("OPENAI_API_KEY")
        print(f"API Key present: {bool(api_key)}")
        print(f"API Key length: {len(api_key) if api_key else 0}")
        print(f"API Key prefix: {api_key[:10] if api_key else 'None'}...")
        
        if not api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not found in environment variables")
        
        print(f"Calling OpenAI API with model: {model}")
        print(f"Prompt length: {len(prompt)}")
        
        response = openai_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=top_p
        )
        print(f"OpenAI API call successful")
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"OpenAI API error details: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
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
    return {"message": "Prompt Engineering Test Harness API"}

@app.get("/models/")
async def get_available_models():
    """Get available models for both providers"""
    # Get actual available models from Ollama
    ollama_models = []
    try:
        ollama_host = os.getenv("OLLAMA_HOST", "host.docker.internal")
        async with httpx.AsyncClient() as client:
            response = await client.get(f"http://{ollama_host}:11434/api/tags", timeout=5.0)
            if response.status_code == 200:
                models_data = response.json()
                ollama_models = [
                    {"id": model["name"], "name": model["name"]} 
                    for model in models_data.get("models", [])
                ]
    except Exception as e:
        print(f"Error fetching Ollama models: {e}")
        # Fallback to empty list if Ollama is not available
    
    return {
        "openai": [
            {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo"},
            {"id": "gpt-4", "name": "GPT-4"},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo"}
        ],
        "ollama": ollama_models
    }

@app.get("/ollama/status/")
async def check_ollama_status():
    """Check if Ollama is running and get available models"""
    # Use host.docker.internal when running in Docker, localhost otherwise
    ollama_host = os.getenv("OLLAMA_HOST", "host.docker.internal")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"http://{ollama_host}:11434/api/tags", timeout=5.0)
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
    """Evaluate output using different methods"""
    if method == "fuzzy":
        # Fuzzy string matching using sequence matcher
        return difflib.SequenceMatcher(None, predicted.lower().strip(), expected.lower().strip()).ratio()
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
        prompt_system = db.query(PromptSystem).filter(PromptSystem.id == test_run.prompt_system_id).first()
        if not prompt_system:
            raise HTTPException(status_code=404, detail="Prompt system not found")
        
        # Process all samples first before creating any database records
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
            score = evaluate_output(predicted_output, expected_output, test_run.evaluation_function)
            total_score += score
            
            results.append({
                "sample_id": str(i),
                "input_variables": variables,
                "expected_output": expected_output,
                "predicted_output": predicted_output,
                "score": score,
                "evaluation_method": test_run.evaluation_function
            })
        
        # Only create database records after all samples are processed successfully
        test_run_id = str(uuid.uuid4())
        db_test_run = TestRun(
            id=test_run_id,
            prompt_system_id=test_run.prompt_system_id,
            created_at=datetime.utcnow()
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
                evaluation_method=result["evaluation_method"]
            )
            db.add(db_result)
        
        # Update test run with aggregate metrics
        avg_score = total_score / len(test_run.regression_set) if test_run.regression_set else 0
        db_test_run.avg_score = avg_score
        db_test_run.total_samples = len(test_run.regression_set)
        
        # Commit everything at once
        db.commit()
        
        return {
            "test_run_id": test_run_id,
            "avg_score": avg_score,
            "total_samples": len(test_run.regression_set),
            "results": results
        }
        
    except Exception as e:
        # Rollback any database changes if an error occurs
        db.rollback()
        print(f"Test run failed, rolling back database changes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Test run failed: {str(e)}")
    finally:
        db.close()

@app.get("/test-runs/{test_run_id}")
async def get_test_run(test_run_id: str):
    db = SessionLocal()
    try:
        test_run = db.query(TestRun).options(joinedload(TestRun.prompt_system)).filter(TestRun.id == test_run_id).first()
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
        test_runs = db.query(TestRun).options(joinedload(TestRun.prompt_system)).order_by(TestRun.created_at.desc()).all()
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
                "description": "Fuzzy string matching using sequence similarity"
            },
            {
                "id": "exact",
                "name": "Exact Match",
                "description": "Exact string match (case-insensitive)"
            },
            {
                "id": "semantic",
                "name": "Semantic Similarity",
                "description": "Word overlap similarity (Jaccard index)"
            },
            {
                "id": "contains",
                "name": "Contains",
                "description": "Check if expected output is contained in predicted output"
            }
        ]
    }

# Test Schedule endpoints
@app.post("/test-schedules/")
async def create_test_schedule(schedule: TestScheduleCreate):
    db = SessionLocal()
    try:
        # Verify prompt system exists
        prompt_system = db.query(PromptSystem).filter(PromptSystem.id == schedule.prompt_system_id).first()
        if not prompt_system:
            raise HTTPException(status_code=404, detail="Prompt system not found")
        
        # Create schedule
        schedule_id = str(uuid.uuid4())
        db_schedule = TestSchedule(
            id=schedule_id,
            prompt_system_id=schedule.prompt_system_id,
            name=schedule.name,
            regression_set=json.dumps(schedule.regression_set),
            interval_hours=schedule.interval_seconds // 60,  # Convert seconds to minutes for storage
            evaluation_function=schedule.evaluation_function,
            email_notifications=schedule.email_notifications,
            email_recipients=json.dumps(schedule.email_recipients) if schedule.email_recipients else None,
            alert_threshold=schedule.alert_threshold,
            is_active=True,
            next_run_at=datetime.utcnow()
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
        schedules = db.query(TestSchedule).options(joinedload(TestSchedule.prompt_system)).order_by(TestSchedule.created_at.desc()).all()
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
            await scheduler.add_schedule(schedule_id, schedule.interval_hours * 60)  # Convert minutes to seconds for scheduler
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
            evaluation_function=comparison.evaluation_function
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
                            prompt, model_id, comparison.model_settings.get("temperature", 0.7), 
                            comparison.model_settings.get("max_tokens", 1000), 
                            comparison.model_settings.get("top_p", 1.0), 
                            comparison.model_settings.get("top_k")
                        )
                    else:
                        response = await call_ollama(
                            prompt, model_id, comparison.model_settings.get("temperature", 0.7), 
                            comparison.model_settings.get("max_tokens", 1000), 
                            comparison.model_settings.get("top_p", 1.0), 
                            comparison.model_settings.get("top_k")
                        )
                    
                    # Evaluate the response
                    score = evaluate_response(response, sample.get("expected_output", ""), comparison.evaluation_function)
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
                    status="completed"
                )
                db.add(result)
                results.append({
                    "model": model_id,
                    "provider": provider,
                    "avg_score": avg_score,
                    "total_samples": total_samples,
                    "status": "completed"
                })
                
            except Exception as e:
                # Save failed result
                result = ModelComparisonResult(
                    id=str(uuid.uuid4()),
                    model_comparison_id=comparison_id,
                    model=model_id,
                    provider=provider if 'provider' in locals() else "unknown",
                    avg_score=0.0,
                    total_samples=0,
                    status="failed"
                )
                db.add(result)
                results.append({
                    "model": model_id,
                    "provider": provider if 'provider' in locals() else "unknown",
                    "avg_score": 0.0,
                    "total_samples": 0,
                    "status": "failed"
                })
                print(f"Error testing model {model_id}: {e}")
        
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
        comparisons = db.query(ModelComparison).order_by(ModelComparison.created_at.desc()).all()
        result = []
        
        for comparison in comparisons:
            results = db.query(ModelComparisonResult).filter(
                ModelComparisonResult.model_comparison_id == comparison.id
            ).all()
            
            result.append({
                "id": comparison.id,
                "prompt_system_id": comparison.prompt_system_id,
                "prompt_template": comparison.prompt_template,
                "template_variables": json.loads(comparison.template_variables) if comparison.template_variables else [],
                "model_settings": json.loads(comparison.model_settings) if comparison.model_settings else {},
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
                        "status": r.status
                    } for r in results
                ]
            })
        
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
        
        test_runs = db.query(TestRun).filter(
            TestRun.prompt_system_id == prompt_system_id,
            TestRun.created_at >= cutoff_date
        ).order_by(TestRun.created_at.asc()).all()
        
        history = []
        for run in test_runs:
            history.append({
                "id": run.id,
                "created_at": run.created_at,
                "avg_score": run.avg_score,
                "total_samples": run.total_samples,
                "is_scheduled": run.test_schedule_id is not None
            })
        
        return history
    finally:
        db.close()



# Initialize scheduler on startup
@app.on_event("startup")
async def startup_event():
    # Run database migrations
    try:
        from migrate import run_migration
        run_migration()
        print("Database migration completed")
    except Exception as e:
        print(f"Migration error: {e}")
    
    # Run evaluation function migration
    try:
        from migrate_evaluation_function import migrate_evaluation_function
        migrate_evaluation_function()
        print("Evaluation function migration completed")
    except Exception as e:
        print(f"Evaluation function migration error: {e}")
    
    # Run email notification migration
    try:
        from migrate_email_notifications import migrate_email_notifications
        migrate_email_notifications()
        print("Email notification migration completed")
    except Exception as e:
        print(f"Email notification migration error: {e}")
    
    # Run model comparison migration
    try:
        from migrate_model_comparison import run_migration
        run_migration()
        print("Model comparison migration completed")
    except Exception as e:
        print(f"Model comparison migration error: {e}")
    
    # Run model comparison v2 migration
    try:
        from migrate_model_comparison_v2 import run_migration
        run_migration()
        print("Model comparison v2 migration completed")
    except Exception as e:
        print(f"Model comparison v2 migration error: {e}")
    
    # Load existing schedules
    await scheduler.load_existing_schedules()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
