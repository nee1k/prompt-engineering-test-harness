from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class TestSchedule(Base):
    __tablename__ = "test_schedules"

    id = Column(String, primary_key=True, index=True)
    prompt_system_id = Column(String, ForeignKey("prompt_systems.id"))
    name = Column(String)
    regression_set = Column(Text)
    interval_hours = Column(Integer)
    evaluation_function = Column(String, default="fuzzy")
    email_notifications = Column(Boolean, default=False)
    email_recipients = Column(Text, nullable=True)
    alert_threshold = Column(Float, default=0.2)
    is_active = Column(Boolean, default=True)
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    prompt_system = relationship("PromptSystem", back_populates="test_schedules")
    test_runs = relationship("TestRun", back_populates="test_schedule")


