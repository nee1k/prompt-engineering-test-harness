import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db
from app.models import PromptSystem, TestResult, TestRun

# Reuse helpers from main until they are modularized
from app.services.llm import call_llm, evaluate_output


router = APIRouter(prefix="/test-runs", tags=["test-runs"])


class TestRunCreate(BaseModel):
    prompt_system_id: str
    regression_set: List[Dict[str, Any]]
    evaluation_function: str = "fuzzy"


@router.post("/")
async def create_test_run(test_run: TestRunCreate, db: Session = Depends(get_db)):
    # Get prompt system
    prompt_system = (
        db.query(PromptSystem).filter(PromptSystem.id == test_run.prompt_system_id).first()
    )
    if not prompt_system:
        raise HTTPException(status_code=404, detail="Prompt system not found")

    # Process all samples first before creating any database records
    results: List[Dict[str, Any]] = []
    total_score = 0.0

    for i, sample in enumerate(test_run.regression_set):
        variables = {k: v for k, v in sample.items() if k != "expected_output"}
        expected_output = sample.get("expected_output", "")

        try:
            prompt = prompt_system.template.format(**variables)
        except KeyError as e:
            raise HTTPException(status_code=400, detail=f"Missing variable in sample {i}: {e}")

        predicted_output = await call_llm(
            prompt=prompt,
            provider=prompt_system.provider,
            model=prompt_system.model,
            temperature=prompt_system.temperature,
            max_tokens=prompt_system.max_tokens,
            top_p=prompt_system.top_p,
            top_k=prompt_system.top_k,
        )

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

    # Persist results
    test_run_id = str(uuid.uuid4())
    db_test_run = TestRun(
        id=test_run_id,
        prompt_system_id=test_run.prompt_system_id,
        created_at=datetime.utcnow(),
    )
    db.add(db_test_run)

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

    avg_score = (
        total_score / len(test_run.regression_set) if test_run.regression_set else 0
    )
    db_test_run.avg_score = avg_score
    db_test_run.total_samples = len(test_run.regression_set)

    db.commit()

    return {
        "test_run_id": test_run_id,
        "avg_score": avg_score,
        "total_samples": len(test_run.regression_set),
        "results": results,
    }


@router.get("/{test_run_id}")
def get_test_run(test_run_id: str, db: Session = Depends(get_db)):
    test_run = (
        db.query(TestRun)
        .options(joinedload(TestRun.prompt_system))
        .filter(TestRun.id == test_run_id)
        .first()
    )
    if not test_run:
        raise HTTPException(status_code=404, detail="Test run not found")

    results = db.query(TestResult).filter(TestResult.test_run_id == test_run_id).all()
    return {"test_run": test_run, "results": results}


@router.get("/")
def list_test_runs(db: Session = Depends(get_db)):
    return (
        db.query(TestRun)
        .options(joinedload(TestRun.prompt_system))
        .order_by(TestRun.created_at.desc())
        .all()
    )

