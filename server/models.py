from sqlalchemy import Column, String, Float, Integer, DateTime, Text, ForeignKey, Boolean
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
    test_schedules = relationship("TestSchedule", back_populates="prompt_system")
    model_comparisons = relationship("ModelComparison", back_populates="prompt_system")

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

class TestSchedule(Base):
    __tablename__ = "test_schedules"

    id = Column(String, primary_key=True, index=True)
    prompt_system_id = Column(String, ForeignKey("prompt_systems.id"))
    name = Column(String)
    regression_set = Column(Text)  # JSON string of regression set
    interval_hours = Column(Integer)  # Minutes between runs (keeping column name for backward compatibility)
    evaluation_function = Column(String, default="fuzzy")  # Evaluation function to use
    email_notifications = Column(Boolean, default=False)  # Enable email notifications
    email_recipients = Column(Text, nullable=True)  # JSON array of email addresses
    alert_threshold = Column(Float, default=0.2)  # Score drop threshold for alerts
    is_active = Column(Boolean, default=True)
    last_run_at = Column(DateTime, nullable=True)
    next_run_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    prompt_system = relationship("PromptSystem", back_populates="test_schedules")
    test_runs = relationship("TestRun", back_populates="test_schedule")

class ModelComparison(Base):
    __tablename__ = "model_comparisons"

    id = Column(String, primary_key=True, index=True)
    prompt_system_id = Column(String, ForeignKey("prompt_systems.id"), nullable=True)
    prompt_template = Column(Text, nullable=True)  # Store the prompt template directly
    template_variables = Column(Text, nullable=True)  # JSON array of template variables
    model_settings = Column(Text, nullable=True)  # JSON object of model settings
    models = Column(Text)  # JSON array of model IDs
    regression_set = Column(Text)  # JSON string of regression set
    evaluation_function = Column(String, default="fuzzy")
    created_at = Column(DateTime, default=datetime.utcnow)

    prompt_system = relationship("PromptSystem", back_populates="model_comparisons")
    results = relationship("ModelComparisonResult", back_populates="model_comparison")

class ModelComparisonResult(Base):
    __tablename__ = "model_comparison_results"

    id = Column(String, primary_key=True, index=True)
    model_comparison_id = Column(String, ForeignKey("model_comparisons.id"))
    model = Column(String)  # Model ID
    provider = Column(String)  # "openai" or "ollama"
    avg_score = Column(Float)
    total_samples = Column(Integer)
    status = Column(String, default="completed")  # "completed", "failed", "running"
    created_at = Column(DateTime, default=datetime.utcnow)

    model_comparison = relationship("ModelComparison", back_populates="results")


