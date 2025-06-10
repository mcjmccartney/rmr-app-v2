-- Check Current Database Schema for Sessions Table
-- This will show us the actual structure of your sessions table

-- Check the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'sessions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check sample data to see the actual format
SELECT 
  id,
  booking_date,
  booking_time,
  session_type,
  quote,
  client_id
FROM sessions 
ORDER BY booking_date DESC, booking_time DESC
LIMIT 10;

-- Check data types and formats
SELECT 
  id,
  booking_date,
  pg_typeof(booking_date) as date_type,
  booking_time,
  pg_typeof(booking_time) as time_type,
  session_type
FROM sessions 
LIMIT 5;
