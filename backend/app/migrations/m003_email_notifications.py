#!/usr/bin/env python3
"""
Database migration script to add email notification fields to test_schedules table
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def migrate_email_notifications():
    """Add email notification fields to test_schedules table"""
    
    # Database connection
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/prompt_engineering_test_harness")
    engine = create_engine(database_url)
    
    try:
        with engine.connect() as conn:
            # Check if email_notifications column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'test_schedules' 
                AND column_name = 'email_notifications'
            """))
            
            if result.fetchone():
                print("✓ email_notifications column already exists")
            else:
                # Add email_notifications column
                conn.execute(text("""
                    ALTER TABLE test_schedules 
                    ADD COLUMN email_notifications BOOLEAN DEFAULT FALSE
                """))
                print("✓ Added email_notifications column to test_schedules table")
            
            # Check if email_recipients column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'test_schedules' 
                AND column_name = 'email_recipients'
            """))
            
            if result.fetchone():
                print("✓ email_recipients column already exists")
            else:
                # Add email_recipients column
                conn.execute(text("""
                    ALTER TABLE test_schedules 
                    ADD COLUMN email_recipients TEXT
                """))
                print("✓ Added email_recipients column to test_schedules table")
            
            # Check if alert_threshold column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'test_schedules' 
                AND column_name = 'alert_threshold'
            """))
            
            if result.fetchone():
                print("✓ alert_threshold column already exists")
            else:
                # Add alert_threshold column
                conn.execute(text("""
                    ALTER TABLE test_schedules 
                    ADD COLUMN alert_threshold FLOAT DEFAULT 0.2
                """))
                print("✓ Added alert_threshold column to test_schedules table")
            
            conn.commit()
            print("✓ Email notification migration completed")
            
    except Exception as e:
        print(f"Error during migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate_email_notifications()
