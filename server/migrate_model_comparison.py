#!/usr/bin/env python3
"""
Migration script to add model comparison tables
"""

import os
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

load_dotenv()


def run_migration():
    """Run the model comparison migration"""
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql://prompt_monitor:prompt_monitor_password@localhost:5432/prompt_monitor",
    )

    try:
        engine = create_engine(database_url)

        with engine.connect() as conn:
            # Check if model_comparisons table exists
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
                conn.commit()
                print("✓ model_comparisons table created")
            else:
                print("✓ model_comparisons table already exists")

            # Check if model_comparison_results table exists
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
                conn.commit()
                print("✓ model_comparison_results table created")
            else:
                print("✓ model_comparison_results table already exists")

    except Exception as e:
        print(f"Migration error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    run_migration()
