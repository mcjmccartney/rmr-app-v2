-- Add special_marking column to sessions table
-- This allows sessions to be marked with special priority indication
-- Run this in your Supabase SQL Editor

-- Add special_marking column to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS special_marking BOOLEAN DEFAULT false;

-- Create index for better performance when querying special marking sessions
CREATE INDEX IF NOT EXISTS idx_sessions_special_marking ON sessions(special_marking);

-- Add comment to document the field
COMMENT ON COLUMN sessions.special_marking IS 'Special marking for priority sessions (shows circle icon in calendar)';

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
