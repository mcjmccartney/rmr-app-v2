-- Migration to add "Training - The Mount" session type
-- Run this migration in Supabase SQL Editor

-- Step 1: Drop the existing constraint
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_session_type_check;

-- Step 2: Add the new constraint with "Training - The Mount" included
ALTER TABLE sessions ADD CONSTRAINT sessions_session_type_check 
CHECK (session_type IN ('In-Person', 'Online', 'Training - 1hr', 'Training - 30mins', 'Training - The Mount', 'Online Catchup', 'Group', 'Phone Call', 'Coaching'));

-- Verification: Check that the constraint was added successfully
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'sessions_session_type_check';
