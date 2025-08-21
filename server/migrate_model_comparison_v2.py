#!/usr/bin/env python3
"""
Migration script to add template columns to model_comparisons table
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    """Run the model comparison v2 migration"""
    database_url = os.getenv("DATABASE_URL", "postgresql://prompt_monitor:prompt_monitor_password@localhost:5432/prompt_monitor")
    
    try:
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            # Check if prompt_template column exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'model_comparisons' 
                    AND column_name = 'prompt_template'
                );
            """))
            
            if not result.scalar():
                print("Adding prompt_template column...")
                conn.execute(text("""
                    ALTER TABLE model_comparisons 
                    ADD COLUMN prompt_template TEXT;
                """))
                conn.commit()
                print("✓ prompt_template column added")
            else:
                print("✓ prompt_template column already exists")
            
            # Check if template_variables column exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'model_comparisons' 
                    AND column_name = 'template_variables'
                );
            """))
            
            if not result.scalar():
                print("Adding template_variables column...")
                conn.execute(text("""
                    ALTER TABLE model_comparisons 
                    ADD COLUMN template_variables TEXT;
                """))
                conn.commit()
                print("✓ template_variables column added")
            else:
                print("✓ template_variables column already exists")
            
            # Check if model_settings column exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'model_comparisons' 
                    AND column_name = 'model_settings'
                );
            """))
            
            if not result.scalar():
                print("Adding model_settings column...")
                conn.execute(text("""
                    ALTER TABLE model_comparisons 
                    ADD COLUMN model_settings TEXT;
                """))
                conn.commit()
                print("✓ model_settings column added")
            else:
                print("✓ model_settings column already exists")
                
    except Exception as e:
        print(f"Migration error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
