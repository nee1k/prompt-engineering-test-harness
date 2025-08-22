#!/usr/bin/env python3
"""
Database migration script to add new columns for scheduling and alerting features.
"""

import os

from sqlalchemy import create_engine, text

from database import DATABASE_URL


def run_migration():
    """Run database migration to add new columns"""
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # Check if test_schedule_id column exists in test_runs table
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

        # Check if test_schedules table exists
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

        # Check if alerts table exists
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
        print("Migration completed successfully!")


if __name__ == "__main__":
    run_migration()
