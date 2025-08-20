import asyncio
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session
from database import SessionLocal
from models import TestSchedule, TestRun, TestResult, Alert, PromptSystem
import uuid

class TestScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.scheduler.start()
        
    async def add_schedule(self, schedule_id: str, interval_seconds: int):
        """Add a new test schedule to the scheduler"""
        trigger = IntervalTrigger(seconds=interval_seconds)
        self.scheduler.add_job(
            self.run_scheduled_test,
            trigger=trigger,
            args=[schedule_id],
            id=schedule_id,
            replace_existing=True
        )
        
    async def remove_schedule(self, schedule_id: str):
        """Remove a test schedule from the scheduler"""
        try:
            self.scheduler.remove_job(schedule_id)
        except:
            pass
            
    async def run_scheduled_test(self, schedule_id: str):
        """Run a scheduled test"""
        db = SessionLocal()
        try:
            # Get the schedule
            schedule = db.query(TestSchedule).filter(TestSchedule.id == schedule_id).first()
            if not schedule or not schedule.is_active:
                return
                
            # Get the prompt system
            prompt_system = db.query(PromptSystem).filter(PromptSystem.id == schedule.prompt_system_id).first()
            if not prompt_system:
                return
                
            # Parse regression set
            regression_set = json.loads(schedule.regression_set)
            
            # Create test run
            test_run_id = str(uuid.uuid4())
            test_run = TestRun(
                id=test_run_id,
                prompt_system_id=schedule.prompt_system_id,
                test_schedule_id=schedule_id,
                created_at=datetime.utcnow()
            )
            db.add(test_run)
            db.commit()
            
            # Import the LLM calling function
            from main import call_llm, evaluate_output
            
            # Process each sample
            results = []
            total_score = 0
            alerts = []
            
            for i, sample in enumerate(regression_set):
                # Extract variables and expected output
                variables = {k: v for k, v in sample.items() if k != 'expected_output'}
                expected_output = sample.get('expected_output', '')
                
                # Interpolate template
                try:
                    prompt = prompt_system.template.format(**variables)
                except KeyError as e:
                    continue
                
                # Call LLM
                try:
                    predicted_output = await call_llm(
                        prompt=prompt,
                        provider=prompt_system.provider,
                        model=prompt_system.model,
                        temperature=prompt_system.temperature,
                        max_tokens=prompt_system.max_tokens,
                        top_p=prompt_system.top_p,
                        top_k=prompt_system.top_k
                    )
                except Exception as e:
                    # Create failure alert
                    alert = Alert(
                        id=str(uuid.uuid4()),
                        test_run_id=test_run_id,
                        alert_type="failure",
                        message=f"LLM call failed for sample {i}: {str(e)}",
                        severity="high"
                    )
                    alerts.append(alert)
                    continue
                
                # Evaluate
                score = evaluate_output(predicted_output, expected_output)
                total_score += score
                
                # Store result
                db_result = TestResult(
                    id=str(uuid.uuid4()),
                    test_run_id=test_run_id,
                    sample_id=str(i),
                    input_variables=json.dumps(variables),
                    expected_output=expected_output,
                    predicted_output=predicted_output,
                    score=score,
                    evaluation_method="fuzzy"
                )
                db.add(db_result)
                
                results.append({
                    "sample_id": str(i),
                    "input_variables": variables,
                    "expected_output": expected_output,
                    "predicted_output": predicted_output,
                    "score": score
                })
            
            # Update test run with aggregate metrics
            avg_score = total_score / len(regression_set) if regression_set else 0
            test_run.avg_score = avg_score
            test_run.total_samples = len(regression_set)
            
            # Check for score drops and create alerts
            if len(regression_set) > 0:
                # Get previous test run for comparison
                prev_test_run = db.query(TestRun).filter(
                    TestRun.test_schedule_id == schedule_id,
                    TestRun.id != test_run_id
                ).order_by(TestRun.created_at.desc()).first()
                
                if prev_test_run and prev_test_run.avg_score:
                    score_drop = prev_test_run.avg_score - avg_score
                    if score_drop > 0.2:  # 20% drop threshold
                        alert = Alert(
                            id=str(uuid.uuid4()),
                            test_run_id=test_run_id,
                            alert_type="score_drop",
                            message=f"Score dropped by {score_drop:.2f} (from {prev_test_run.avg_score:.2f} to {avg_score:.2f})",
                            severity="medium" if score_drop > 0.3 else "low"
                        )
                        alerts.append(alert)
            
            # Add all alerts to database
            for alert in alerts:
                db.add(alert)
            
            # Update schedule
            schedule.last_run_at = datetime.utcnow()
            schedule.next_run_at = datetime.utcnow() + timedelta(hours=schedule.interval_hours)
            
            db.commit()
            
            print(f"Scheduled test completed for {schedule.name}: avg_score={avg_score}, alerts={len(alerts)}")
            
        except Exception as e:
            print(f"Error running scheduled test {schedule_id}: {e}")
            db.rollback()
        finally:
            db.close()
            
    async def load_existing_schedules(self):
        """Load all existing active schedules into the scheduler"""
        db = SessionLocal()
        try:
            schedules = db.query(TestSchedule).filter(TestSchedule.is_active == True).all()
            for schedule in schedules:
                await self.add_schedule(schedule.id, schedule.interval_hours * 3600)
            print(f"Loaded {len(schedules)} existing schedules")
        finally:
            db.close()

# Global scheduler instance
scheduler = TestScheduler()
