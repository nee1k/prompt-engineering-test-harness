from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models import PromptSystem


router = APIRouter(prefix="/prompt-systems", tags=["prompt-systems"])


@router.get("/")
def list_prompt_systems(db: Session = Depends(get_db)):
    return db.query(PromptSystem).all()

