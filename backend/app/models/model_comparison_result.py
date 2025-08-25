from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Float, Integer, String
from sqlalchemy.orm import relationship

from app.db.session import Base


class ModelComparisonResult(Base):
    __tablename__ = "model_comparison_results"

    id = Column(String, primary_key=True, index=True)
    model_comparison_id = Column(String, ForeignKey("model_comparisons.id"))
    model = Column(String)
    provider = Column(String)
    avg_score = Column(Float)
    total_samples = Column(Integer)
    status = Column(String, default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)

    model_comparison = relationship("ModelComparison", back_populates="results")


