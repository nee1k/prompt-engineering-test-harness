import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db
from app.models import PromptSystem, TestSchedule
from app.services.scheduler import scheduler


router = APIRouter(prefix="/test-schedules", tags=["test-schedules"])


@router.post("/")
async def create_test_schedule(
    schedule: dict, db: Session = Depends(get_db)
):
    # Verify prompt system exists
    prompt_system = (
        db.query(PromptSystem).filter(PromptSystem.id == schedule.get("prompt_system_id")).first()
    )
    if not prompt_system:
        raise HTTPException(status_code=404, detail="Prompt system not found")

    # Create schedule
    schedule_id = str(uuid.uuid4())
    db_schedule = TestSchedule(
        id=schedule_id,
        prompt_system_id=schedule["prompt_system_id"],
        name=schedule["name"],
        regression_set=json.dumps(schedule["regression_set"]),
        interval_hours=schedule["interval_seconds"] // 60,
        evaluation_function=schedule.get("evaluation_function", "fuzzy"),
        email_notifications=schedule.get("email_notifications", False),
        email_recipients=(
            json.dumps(schedule.get("email_recipients"))
            if schedule.get("email_recipients")
            else None
        ),
        alert_threshold=schedule.get("alert_threshold", 0.2),
        is_active=True,
        next_run_at=datetime.utcnow(),
    )
    db.add(db_schedule)
    db.commit()

    # Add to scheduler
    await scheduler.add_schedule(schedule_id, schedule["interval_seconds"])

    return db_schedule


@router.get("/")
def list_test_schedules(db: Session = Depends(get_db)):
    return (
        db.query(TestSchedule)
        .options(joinedload(TestSchedule.prompt_system))
        .order_by(TestSchedule.created_at.desc())
        .all()
    )


@router.put("/{schedule_id}/toggle")
async def toggle_test_schedule(schedule_id: str, db: Session = Depends(get_db)):
    schedule = db.query(TestSchedule).filter(TestSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Test schedule not found")

    schedule.is_active = not schedule.is_active

    if schedule.is_active:
        await scheduler.add_schedule(schedule_id, schedule.interval_hours * 60)
    else:
        await scheduler.remove_schedule(schedule_id)

    db.commit()
    return schedule


@router.delete("/{schedule_id}")
async def delete_test_schedule(schedule_id: str, db: Session = Depends(get_db)):
    schedule = db.query(TestSchedule).filter(TestSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Test schedule not found")

    await scheduler.remove_schedule(schedule_id)
    db.delete(schedule)
    db.commit()
    return {"message": "Schedule deleted"}

