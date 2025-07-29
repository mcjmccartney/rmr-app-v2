-- Add dog_name column to sessions table
-- This allows sessions to specify which dog the session is for when clients have multiple dogs
-- Run this in your Supabase SQL Editor

-- Add dog_name column to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS dog_name VARCHAR(255);

-- Create index for better performance when querying by dog_name
CREATE INDEX IF NOT EXISTS idx_sessions_dog_name ON sessions(dog_name);

-- Verify the new structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'sessions'
  AND table_schema = 'public'
ORDER BY ordinal_position;
