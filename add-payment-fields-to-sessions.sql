-- Add payment tracking fields to sessions table
-- Run this in your Supabase SQL Editor to add payment fields to existing sessions table

-- Add payment tracking columns
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS session_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance when querying paid sessions
CREATE INDEX IF NOT EXISTS idx_sessions_paid ON sessions(session_paid);
CREATE INDEX IF NOT EXISTS idx_sessions_payment_confirmed ON sessions(payment_confirmed_at);

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
