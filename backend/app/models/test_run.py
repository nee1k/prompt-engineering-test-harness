from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class TestRun(Base):
    __tablename__ = "test_runs"

    id = Column(String, primary_key=True, index=True)
    prompt_system_id = Column(String, ForeignKey("prompt_systems.id"))
    test_schedule_id = Column(String, ForeignKey("test_schedules.id"), nullable=True)
    avg_score = Column(Float, nullable=True)
    total_samples = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    prompt_system = relationship("PromptSystem", back_populates="test_runs")
    test_schedule = relationship("TestSchedule", back_populates="test_runs")
    results = relationship("TestResult", back_populates="test_run")


