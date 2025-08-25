from fastapi import APIRouter


router = APIRouter(tags=["health"])


@router.get("/")
def root():
    return {"message": "Prompt Engineering Test Harness API"}

