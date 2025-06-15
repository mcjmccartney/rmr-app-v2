-- Add Event ID and Google Meet link fields to sessions table for Make.com integration
-- Run this in your Supabase SQL Editor to add the new columns

-- Add event_id and google_meet_link columns to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS event_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS google_meet_link TEXT;

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
