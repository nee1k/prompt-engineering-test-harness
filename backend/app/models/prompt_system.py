from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class PromptSystem(Base):
    __tablename__ = "prompt_systems"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    template = Column(Text)
    variables = Column(Text)
    provider = Column(String, default="openai")
    model = Column(String)
    temperature = Column(Float)
    max_tokens = Column(Integer)
    top_p = Column(Float)
    top_k = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    test_runs = relationship("TestRun", back_populates="prompt_system")
    test_schedules = relationship("TestSchedule", back_populates="prompt_system")
    model_comparisons = relationship("ModelComparison", back_populates="prompt_system")


