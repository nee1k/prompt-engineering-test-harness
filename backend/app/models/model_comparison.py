from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class ModelComparison(Base):
    __tablename__ = "model_comparisons"

    id = Column(String, primary_key=True, index=True)
    prompt_system_id = Column(String, ForeignKey("prompt_systems.id"), nullable=True)
    prompt_template = Column(Text, nullable=True)
    template_variables = Column(Text, nullable=True)
    model_settings = Column(Text, nullable=True)
    models = Column(Text)
    regression_set = Column(Text)
    evaluation_function = Column(String, default="fuzzy")
    created_at = Column(DateTime, default=datetime.utcnow)

    prompt_system = relationship("PromptSystem", back_populates="model_comparisons")
    results = relationship("ModelComparisonResult", back_populates="model_comparison")


