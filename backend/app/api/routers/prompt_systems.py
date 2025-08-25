import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import PromptSystem


router = APIRouter(prefix="/prompt-systems", tags=["prompt-systems"])


class PromptSystemCreate(BaseModel):
    name: str
    template: str
    variables: list[str]
    provider: str = "openai"
    model: str = "gpt-3.5-turbo"
    temperature: float = 0.7
    max_tokens: int = 1000
    top_p: float = 1.0
    top_k: Optional[int] = None


@router.post("/")
def create_prompt_system(payload: PromptSystemCreate, db: Session = Depends(get_db)):
    db_prompt_system = PromptSystem(
        id=str(uuid.uuid4()),
        name=payload.name,
        template=payload.template,
        variables=json.dumps(payload.variables),
        provider=payload.provider,
        model=payload.model,
        temperature=payload.temperature,
        max_tokens=payload.max_tokens,
        top_p=payload.top_p,
        top_k=payload.top_k,
        created_at=datetime.utcnow(),
    )
    db.add(db_prompt_system)
    db.commit()
    db.refresh(db_prompt_system)
    return db_prompt_system


@router.get("/")
def list_prompt_systems(db: Session = Depends(get_db)):
    return db.query(PromptSystem).all()


@router.get("/{prompt_system_id}")
def get_prompt_system(prompt_system_id: str, db: Session = Depends(get_db)):
    prompt_system = (
        db.query(PromptSystem).filter(PromptSystem.id == prompt_system_id).first()
    )
    if not prompt_system:
        raise HTTPException(status_code=404, detail="Prompt system not found")
    return prompt_system

