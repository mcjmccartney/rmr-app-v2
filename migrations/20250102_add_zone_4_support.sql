-- Add Zone 4 support to travel_expense column
-- This migration updates the check constraint to include Zone 4 (£20)
-- Run this in your Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE sessions
DROP CONSTRAINT IF EXISTS sessions_travel_expense_check;

-- Add the new constraint with Zone 4 included
ALTER TABLE sessions
ADD CONSTRAINT sessions_travel_expense_check 
CHECK (travel_expense IS NULL OR travel_expense IN ('Zone 1', 'Zone 2', 'Zone 3', 'Zone 4'));

-- Update the comment to reflect the new zone
COMMENT ON COLUMN sessions.travel_expense IS 'Travel expense zone: Zone 1 (£5), Zone 2 (£10), Zone 3 (£15), Zone 4 (£20)';

-- Verification: Check that the constraint was added successfully
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'sessions_travel_expense_check';

