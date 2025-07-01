-- Fix Date Format Issues in Sessions Table
-- This script helps identify and fix any day/month confusion in booking_date

-- STEP 1: First, let's see what we're working with
SELECT 
  id,
  booking_date,
  booking_date::text as date_text,
  EXTRACT(year FROM booking_date) as year,
  EXTRACT(month FROM booking_date) as month,
  EXTRACT(day FROM booking_date) as day,
  EXTRACT(hour FROM booking_date) as hour,
  EXTRACT(minute FROM booking_date) as minute,
  session_type
FROM sessions 
ORDER BY booking_date DESC;

-- STEP 2: Check for potentially problematic dates
-- These are dates where day <= 12, which could be confused with months
SELECT 
  id,
  booking_date,
  EXTRACT(day FROM booking_date) as day,
  EXTRACT(month FROM booking_date) as month,
  EXTRACT(year FROM booking_date) as year,
  session_type,
  CASE 
    WHEN EXTRACT(day FROM booking_date) <= 12 AND EXTRACT(month FROM booking_date) <= 12 THEN 'POTENTIALLY SWAPPED'
    WHEN EXTRACT(day FROM booking_date) > 12 THEN 'CORRECT (day > 12)'
    ELSE 'UNCLEAR'
  END as status
FROM sessions 
WHERE EXTRACT(day FROM booking_date) <= 12 
  AND EXTRACT(month FROM booking_date) <= 12
ORDER BY booking_date;

-- STEP 3: If you need to swap day and month for specific records
-- UNCOMMENT AND MODIFY THE FOLLOWING QUERY IF NEEDED:

-- UPDATE sessions 
-- SET booking_date = (
--   EXTRACT(year FROM booking_date)::text || '-' ||
--   LPAD(EXTRACT(day FROM booking_date)::text, 2, '0') || '-' ||
--   LPAD(EXTRACT(month FROM booking_date)::text, 2, '0') || ' ' ||
--   LPAD(EXTRACT(hour FROM booking_date)::text, 2, '0') || ':' ||
--   LPAD(EXTRACT(minute FROM booking_date)::text, 2, '0') || ':' ||
--   LPAD(EXTRACT(second FROM booking_date)::text, 2, '0')
-- )::timestamp
-- WHERE id IN (
--   -- Add specific session IDs that need day/month swapped
--   'session-id-1',
--   'session-id-2'
-- );

-- STEP 4: Verify the timezone is set correctly
-- Ensure all dates are stored as UTC
SELECT 
  id,
  booking_date,
  booking_date AT TIME ZONE 'UTC' as utc_time,
  timezone('UTC', booking_date) as explicit_utc
FROM sessions 
ORDER BY booking_date DESC
LIMIT 5;

-- STEP 5: Check for any NULL or invalid dates
SELECT 
  COUNT(*) as total_sessions,
  COUNT(booking_date) as sessions_with_dates,
  COUNT(*) - COUNT(booking_date) as sessions_missing_dates
FROM sessions;
