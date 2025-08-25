from sqlalchemy import Column, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(String, primary_key=True, index=True)
    test_run_id = Column(String, ForeignKey("test_runs.id"))
    sample_id = Column(String)
    input_variables = Column(Text)
    expected_output = Column(Text)
    predicted_output = Column(Text)
    score = Column(Float)
    evaluation_method = Column(String)

    test_run = relationship("TestRun", back_populates="results")


