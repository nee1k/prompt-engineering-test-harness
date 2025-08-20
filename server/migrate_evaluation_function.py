#!/usr/bin/env python3
"""
Database migration script to add evaluation_function column to test_schedules table
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def migrate_evaluation_function():
    """Add evaluation_function column to test_schedules table"""
    
    # Database connection
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/prompt_engineering_test_harness")
    engine = create_engine(database_url)
    
    try:
        with engine.connect() as conn:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'test_schedules' 
                AND column_name = 'evaluation_function'
            """))
            
            if result.fetchone():
                print("✓ evaluation_function column already exists")
                return
            
            # Add the column
            conn.execute(text("""
                ALTER TABLE test_schedules 
                ADD COLUMN evaluation_function VARCHAR(50) DEFAULT 'fuzzy'
            """))
            
            # Update existing records to have the default value
            conn.execute(text("""
                UPDATE test_schedules 
                SET evaluation_function = 'fuzzy' 
                WHERE evaluation_function IS NULL
            """))
            
            conn.commit()
            print("✓ Added evaluation_function column to test_schedules table")
            
    except Exception as e:
        print(f"Error during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate_evaluation_function()
