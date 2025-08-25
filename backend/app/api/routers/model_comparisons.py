import json
import uuid
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import ModelComparison, ModelComparisonResult
from app.services.llm import call_llm, call_openai, evaluate_output


router = APIRouter(prefix="/model-comparisons", tags=["model-comparisons"])


@router.post("/")
async def create_model_comparison(comparison: Dict[str, Any], db: Session = Depends(get_db)):
    comparison_id = str(uuid.uuid4())
    db_comparison = ModelComparison(
        id=comparison_id,
        prompt_system_id=None,
        prompt_template=comparison["prompt_template"],
        template_variables=json.dumps(comparison["template_variables"]),
        model_settings=json.dumps(comparison.get("model_settings", {})),
        models=json.dumps(comparison["models"]),
        regression_set=json.dumps(comparison["regression_set"]),
        evaluation_function=comparison.get("evaluation_function", "fuzzy"),
    )
    db.add(db_comparison)
    db.commit()

    results: List[Dict[str, Any]] = []
    for model_id in comparison["models"]:
        try:
            provider = "openai" if model_id.startswith("gpt-") else "ollama"

            total_score = 0.0
            total_samples = len(comparison["regression_set"])

            for sample in comparison["regression_set"]:
                prompt = comparison["prompt_template"]
                for var in comparison["template_variables"]:
                    if var in sample:
                        prompt = prompt.replace(f"{{{var}}}", str(sample[var]))

                if provider == "openai":
                    response = await call_openai(
                        prompt,
                        model_id,
                        comparison.get("model_settings", {}).get("temperature", 0.7),
                        comparison.get("model_settings", {}).get("max_tokens", 1000),
                        comparison.get("model_settings", {}).get("top_p", 1.0),
                        comparison.get("model_settings", {}).get("top_k"),
                    )
                else:
                    response = await call_llm(
                        prompt,
                        provider,
                        model_id,
                        comparison.get("model_settings", {}).get("temperature", 0.7),
                        comparison.get("model_settings", {}).get("max_tokens", 1000),
                        comparison.get("model_settings", {}).get("top_p", 1.0),
                        comparison.get("model_settings", {}).get("top_k"),
                    )

                score = evaluate_output(
                    response, sample.get("expected_output", ""), comparison["evaluation_function"]
                )
                total_score += score

            avg_score = total_score / total_samples if total_samples > 0 else 0.0

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
        except Exception:
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


@router.get("/")
def list_model_comparisons(db: Session = Depends(get_db)):
    comparisons = (
        db.query(ModelComparison).order_by(ModelComparison.created_at.desc()).all()
    )
    out: List[Dict[str, Any]] = []
    for comparison in comparisons:
        results = (
            db.query(ModelComparisonResult)
            .filter(ModelComparisonResult.model_comparison_id == comparison.id)
            .all()
        )
        out.append(
            {
                "id": comparison.id,
                "prompt_system_id": comparison.prompt_system_id,
                "prompt_template": comparison.prompt_template,
                "template_variables": json.loads(comparison.template_variables)
                if comparison.template_variables
                else [],
                "model_settings": json.loads(comparison.model_settings)
                if comparison.model_settings
                else {},
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
    return out

