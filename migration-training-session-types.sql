-- Migration to rename existing "Training" sessions to "Training - 1hr" and add new "Training - 30mins" type
-- Run this migration in Supabase SQL Editor

-- Step 1: Update existing "Training" sessions to "Training - 1hr"
UPDATE sessions 
SET session_type = 'Training - 1hr' 
WHERE session_type = 'Training';

-- Step 2: Drop the existing constraint
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_session_type_check;

-- Step 3: Add the new constraint with updated session types
ALTER TABLE sessions ADD CONSTRAINT sessions_session_type_check 
CHECK (session_type IN ('In-Person', 'Online', 'Training - 1hr', 'Training - 30mins', 'Online Catchup', 'Group', 'Phone Call', 'Coaching'));

-- Verify the changes
SELECT session_type, COUNT(*) as count 
FROM sessions 
GROUP BY session_type 
ORDER BY session_type;
