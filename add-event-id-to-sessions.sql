-- Add Event ID field to sessions table for Google Calendar integration
-- Run this in your Supabase SQL Editor to add the event_id column

-- Add event_id column to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS event_id VARCHAR(255);

-- Create index for better performance when querying by event_id
CREATE INDEX IF NOT EXISTS idx_sessions_event_id ON sessions(event_id);

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
