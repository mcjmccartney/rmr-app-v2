-- Add travel_expense column to sessions table
-- This allows tracking of travel expenses for sessions
-- Zones: Zone 1 = £10, Zone 2 = £15, Zone 3 = £20

-- Add the column
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS travel_expense VARCHAR(10);

-- Add a check constraint to ensure only valid values
ALTER TABLE sessions
ADD CONSTRAINT sessions_travel_expense_check 
CHECK (travel_expense IS NULL OR travel_expense IN ('Zone 1', 'Zone 2', 'Zone 3'));

-- Add a comment to document the column
COMMENT ON COLUMN sessions.travel_expense IS 'Travel expense zone: Zone 1 (£10), Zone 2 (£15), Zone 3 (£20)';

