#!/usr/bin/env python3
"""
Consolidated Database Migration System for Prompt Engineering Test Harness

This file consolidates all database migrations into a single, organized system.
Migrations are run in order and are idempotent (safe to run multiple times).
"""

import os
import sys
from typing import List, Dict, Any

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

load_dotenv()

# Database connection
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/prompt_engineering_test_harness",
)


class Migration:
    """Base migration class"""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
    
    def run(self, engine) -> bool:
        """Run the migration. Override in subclasses."""
        raise NotImplementedError
    
    def __str__(self):
        return f"{self.name}: {self.description}"


class Migration001_InitialSchema(Migration):
    """Initial database schema setup"""
    
    def __init__(self):
        super().__init__("001_InitialSchema", "Create initial tables and columns")
    
    def run(self, engine) -> bool:
        with engine.connect() as conn:
            # Add test_schedule_id column to test_runs table
            result = conn.execute(
                text(
                    """
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'test_runs' AND column_name = 'test_schedule_id'
            """
                )
            )
            
            if not result.fetchone():
                print("Adding test_schedule_id column to test_runs table...")
                conn.execute(
                    text("ALTER TABLE test_runs ADD COLUMN test_schedule_id VARCHAR")
                )
                print("✓ Added test_schedule_id column")
            else:
                print("✓ test_schedule_id column already exists")
            
            # Create test_schedules table
            result = conn.execute(
                text(
                    """
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'test_schedules'
            """
                )
            )
            
            if not result.fetchone():
                print("Creating test_schedules table...")
                conn.execute(
                    text(
                        """
                    CREATE TABLE test_schedules (
                        id VARCHAR PRIMARY KEY,
                        prompt_system_id VARCHAR NOT NULL,
                        name VARCHAR NOT NULL,
                        regression_set TEXT NOT NULL,
                        interval_hours INTEGER NOT NULL,
                        is_active BOOLEAN DEFAULT TRUE,
                        last_run_at TIMESTAMP,
                        next_run_at TIMESTAMP,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """
                    )
                )
                print("✓ Created test_schedules table")
            else:
                print("✓ test_schedules table already exists")
            
            # Create alerts table
            result = conn.execute(
                text(
                    """
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'alerts'
            """
                )
            )
            
            if not result.fetchone():
                print("Creating alerts table...")
                conn.execute(
                    text(
                        """
                    CREATE TABLE alerts (
                        id VARCHAR PRIMARY KEY,
                        test_run_id VARCHAR NOT NULL,
                        alert_type VARCHAR NOT NULL,
                        message TEXT NOT NULL,
                        severity VARCHAR NOT NULL,
                        is_resolved BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """
                    )
                )
                print("✓ Created alerts table")
            else:
                print("✓ alerts table already exists")
            
            conn.commit()
            return True


class Migration002_EvaluationFunction(Migration):
    """Add evaluation function support"""
    
    def __init__(self):
        super().__init__("002_EvaluationFunction", "Add evaluation_function column to test_schedules")
    
    def run(self, engine) -> bool:
        with engine.connect() as conn:
            result = conn.execute(
                text(
                    """
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'test_schedules' 
                AND column_name = 'evaluation_function'
            """
                )
            )
            
            if result.fetchone():
                print("✓ evaluation_function column already exists")
                return True
            
            # Add the column
            conn.execute(
                text(
                    """
                ALTER TABLE test_schedules 
                ADD COLUMN evaluation_function VARCHAR(50) DEFAULT 'fuzzy'
            """
                )
            )
            
            # Update existing records
            conn.execute(
                text(
                    """
                UPDATE test_schedules 
                SET evaluation_function = 'fuzzy' 
                WHERE evaluation_function IS NULL
            """
                )
            )
            
            conn.commit()
            print("✓ Added evaluation_function column to test_schedules table")
            return True


class Migration003_EmailNotifications(Migration):
    """Add email notification support"""
    
    def __init__(self):
        super().__init__("003_EmailNotifications", "Add email notification fields to test_schedules")
    
    def run(self, engine) -> bool:
        with engine.connect() as conn:
            # Add email_notifications column
            result = conn.execute(
                text(
                    """
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'test_schedules' 
                AND column_name = 'email_notifications'
            """
                )
            )
            
            if result.fetchone():
                print("✓ email_notifications column already exists")
            else:
                conn.execute(
                    text(
                        """
                    ALTER TABLE test_schedules 
                    ADD COLUMN email_notifications BOOLEAN DEFAULT FALSE
                """
                    )
                )
                print("✓ Added email_notifications column to test_schedules table")
            
            # Add email_recipients column
            result = conn.execute(
                text(
                    """
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'test_schedules' 
                AND column_name = 'email_recipients'
            """
                )
            )
            
            if result.fetchone():
                print("✓ email_recipients column already exists")
            else:
                conn.execute(
                    text(
                        """
                    ALTER TABLE test_schedules 
                    ADD COLUMN email_recipients TEXT
                """
                    )
                )
                print("✓ Added email_recipients column to test_schedules table")
            
            # Add alert_threshold column
            result = conn.execute(
                text(
                    """
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'test_schedules' 
                AND column_name = 'alert_threshold'
            """
                )
            )
            
            if result.fetchone():
                print("✓ alert_threshold column already exists")
            else:
                conn.execute(
                    text(
                        """
                    ALTER TABLE test_schedules 
                    ADD COLUMN alert_threshold FLOAT DEFAULT 0.2
                """
                    )
                )
                print("✓ Added alert_threshold column to test_schedules table")
            
            conn.commit()
            print("✓ Email notification migration completed")
            return True


class Migration004_ModelComparison(Migration):
    """Add model comparison tables"""
    
    def __init__(self):
        super().__init__("004_ModelComparison", "Create model comparison tables")
    
    def run(self, engine) -> bool:
        with engine.connect() as conn:
            # Create model_comparisons table
            result = conn.execute(
                text(
                    """
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'model_comparisons'
                );
            """
                )
            )
            
            if not result.scalar():
                print("Creating model_comparisons table...")
                conn.execute(
                    text(
                        """
                    CREATE TABLE model_comparisons (
                        id VARCHAR PRIMARY KEY,
                        prompt_system_id VARCHAR NOT NULL,
                        models TEXT NOT NULL,
                        regression_set TEXT NOT NULL,
                        evaluation_function VARCHAR DEFAULT 'fuzzy',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """
                    )
                )
                print("✓ model_comparisons table created")
            else:
                print("✓ model_comparisons table already exists")
            
            # Create model_comparison_results table
            result = conn.execute(
                text(
                    """
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'model_comparison_results'
                );
            """
                )
            )
            
            if not result.scalar():
                print("Creating model_comparison_results table...")
                conn.execute(
                    text(
                        """
                    CREATE TABLE model_comparison_results (
                        id VARCHAR PRIMARY KEY,
                        model_comparison_id VARCHAR NOT NULL,
                        model VARCHAR NOT NULL,
                        provider VARCHAR NOT NULL,
                        avg_score FLOAT NOT NULL,
                        total_samples INTEGER NOT NULL,
                        status VARCHAR DEFAULT 'completed',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (model_comparison_id) REFERENCES model_comparisons(id)
                    );
                """
                    )
                )
                print("✓ model_comparison_results table created")
            else:
                print("✓ model_comparison_results table already exists")
            
            conn.commit()
            return True


class Migration005_ModelComparisonV2(Migration):
    """Add template support to model comparisons"""
    
    def __init__(self):
        super().__init__("005_ModelComparisonV2", "Add template columns to model_comparisons")
    
    def run(self, engine) -> bool:
        with engine.connect() as conn:
            # Add prompt_template column
            result = conn.execute(
                text(
                    """
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'model_comparisons' 
                    AND column_name = 'prompt_template'
                );
            """
                )
            )
            
            if not result.scalar():
                print("Adding prompt_template column...")
                conn.execute(
                    text(
                        """
                    ALTER TABLE model_comparisons 
                    ADD COLUMN prompt_template TEXT;
                """
                    )
                )
                print("✓ prompt_template column added")
            else:
                print("✓ prompt_template column already exists")
            
            # Add template_variables column
            result = conn.execute(
                text(
                    """
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'model_comparisons' 
                    AND column_name = 'template_variables'
                );
            """
                )
            )
            
            if not result.scalar():
                print("Adding template_variables column...")
                conn.execute(
                    text(
                        """
                    ALTER TABLE model_comparisons 
                    ADD COLUMN template_variables TEXT;
                """
                    )
                )
                print("✓ template_variables column added")
            else:
                print("✓ template_variables column already exists")
            
            # Add model_settings column
            result = conn.execute(
                text(
                    """
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'model_comparisons' 
                    AND column_name = 'model_settings'
                );
            """
                )
            )
            
            if not result.scalar():
                print("Adding model_settings column...")
                conn.execute(
                    text(
                        """
                    ALTER TABLE model_comparisons 
                    ADD COLUMN model_settings TEXT;
                """
                    )
                )
                print("✓ model_settings column added")
            else:
                print("✓ model_settings column already exists")
            
            conn.commit()
            return True


class MigrationManager:
    """Manages database migrations"""
    
    def __init__(self):
        self.migrations: List[Migration] = [
            Migration001_InitialSchema(),
            Migration002_EvaluationFunction(),
            Migration003_EmailNotifications(),
            Migration004_ModelComparison(),
            Migration005_ModelComparisonV2(),
        ]
    
    def run_all_migrations(self) -> bool:
        """Run all migrations in order"""
        print("🚀 Starting database migrations...")
        
        try:
            engine = create_engine(DATABASE_URL)
            
            for migration in self.migrations:
                print(f"\n📋 Running {migration.name}...")
                print(f"   {migration.description}")
                
                try:
                    success = migration.run(engine)
                    if success:
                        print(f"✅ {migration.name} completed successfully")
                    else:
                        print(f"❌ {migration.name} failed")
                        return False
                except Exception as e:
                    print(f"❌ {migration.name} failed with error: {e}")
                    return False
            
            print("\n🎉 All migrations completed successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Migration system failed: {e}")
            return False
    
    def list_migrations(self):
        """List all available migrations"""
        print("📋 Available migrations:")
        for i, migration in enumerate(self.migrations, 1):
            print(f"  {i}. {migration}")


def run_migrations():
    """Main function to run migrations"""
    manager = MigrationManager()
    return manager.run_all_migrations()


def list_migrations():
    """List all available migrations"""
    manager = MigrationManager()
    manager.list_migrations()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "list":
        list_migrations()
    else:
        run_migrations()
