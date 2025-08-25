-- Initialize Prompt Engineering Test Harness database
-- Note: Database is already created by POSTGRES_DB environment variable

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';
