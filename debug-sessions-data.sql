-- Debug Sessions Data - Check what's causing the calendar error
-- Run this in your Supabase SQL Editor to see what's wrong

-- STEP 1: Check the current table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'sessions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 2: Check sample data to see what we have
SELECT 
  id,
  client_id,
  session_type,
  booking_date,
  booking_time,
  quote,
  email,
  created_at
FROM sessions 
ORDER BY created_at DESC
LIMIT 10;

-- STEP 3: Check for NULL or invalid date/time values
SELECT
  id,
  booking_date,
  booking_time,
  CASE
    WHEN booking_date IS NULL THEN 'NULL DATE'
    WHEN booking_time IS NULL THEN 'NULL TIME'
    ELSE 'OK'
  END as status
FROM sessions
WHERE booking_date IS NULL
   OR booking_time IS NULL
ORDER BY created_at DESC;

-- STEP 4: Check data types and sample values
SELECT 
  id,
  booking_date,
  pg_typeof(booking_date) as date_type,
  booking_time,
  pg_typeof(booking_time) as time_type,
  LENGTH(booking_date::text) as date_length,
  LENGTH(booking_time::text) as time_length
FROM sessions 
LIMIT 5;

-- STEP 5: Check if we still have the old booking_date column
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'sessions' 
    AND column_name = 'booking_date' 
    AND data_type = 'timestamp with time zone'
) as has_old_timestamp_column;

-- STEP 6: Count sessions by status
SELECT 
  COUNT(*) as total_sessions,
  COUNT(booking_date) as sessions_with_date,
  COUNT(booking_time) as sessions_with_time,
  COUNT(client_id) as sessions_with_client,
  COUNT(CASE WHEN booking_date IS NOT NULL AND booking_time IS NOT NULL THEN 1 END) as complete_sessions
FROM sessions;

-- STEP 7: Show sessions that might be causing issues
SELECT
  id,
  client_id,
  booking_date,
  booking_time,
  session_type,
  'PROBLEMATIC SESSION' as issue
FROM sessions
WHERE booking_date IS NULL
   OR booking_time IS NULL
   OR LENGTH(booking_date::text) < 8  -- Should be at least YYYY-MM-DD
   OR LENGTH(booking_time::text) < 5; -- Should be at least HH:mm
