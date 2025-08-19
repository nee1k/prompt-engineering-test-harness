from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class PromptSystem(Base):
    __tablename__ = "prompt_systems"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    template = Column(Text)
    variables = Column(Text)  # JSON string
    provider = Column(String, default="openai")  # "openai" or "ollama"
    model = Column(String)
    temperature = Column(Float)
    max_tokens = Column(Integer)
    top_p = Column(Float)
    top_k = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    test_runs = relationship("TestRun", back_populates="prompt_system")

class TestRun(Base):
    __tablename__ = "test_runs"

    id = Column(String, primary_key=True, index=True)
    prompt_system_id = Column(String, ForeignKey("prompt_systems.id"))
    avg_score = Column(Float, nullable=True)
    total_samples = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    prompt_system = relationship("PromptSystem", back_populates="test_runs")
    results = relationship("TestResult", back_populates="test_run")

class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(String, primary_key=True, index=True)
    test_run_id = Column(String, ForeignKey("test_runs.id"))
    sample_id = Column(String)
    input_variables = Column(Text)  # JSON string
    expected_output = Column(Text)
    predicted_output = Column(Text)
    score = Column(Float)
    evaluation_method = Column(String)

    test_run = relationship("TestRun", back_populates="results")
