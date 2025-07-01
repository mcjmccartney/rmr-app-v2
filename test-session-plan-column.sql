-- Test if session_plan_sent column exists in sessions table
-- Run this in Supabase SQL Editor to check

-- Check if column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sessions' 
AND column_name = 'session_plan_sent';

-- If the column doesn't exist, create it
-- ALTER TABLE sessions ADD COLUMN session_plan_sent BOOLEAN DEFAULT FALSE;

-- Check current sessions table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'sessions' 
ORDER BY ordinal_position;
