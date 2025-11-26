-- Add session_number column to sessions table
-- This field stores the session number for each client (counting only Online and In-Person sessions)
-- Session number is calculated based on client_id and booking_date/booking_time

-- Add session_number column to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS session_number INTEGER;

-- Create index for better performance when querying by session_number
CREATE INDEX IF NOT EXISTS idx_sessions_session_number ON sessions(session_number);

-- Add comment to explain the column
COMMENT ON COLUMN sessions.session_number IS 'Session number for this client (counting only Online and In-Person sessions, ordered by booking date/time)';

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

