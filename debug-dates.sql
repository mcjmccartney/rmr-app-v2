-- Debug Date Issues in Supabase
-- Run this to check how dates are stored and formatted

-- Check the format of booking_date in your sessions table
SELECT 
  id,
  booking_date,
  booking_date::text as booking_date_text,
  EXTRACT(year FROM booking_date) as year,
  EXTRACT(month FROM booking_date) as month,
  EXTRACT(day FROM booking_date) as day,
  EXTRACT(hour FROM booking_date) as hour,
  EXTRACT(minute FROM booking_date) as minute,
  session_type
FROM sessions 
ORDER BY booking_date DESC
LIMIT 10;

-- Check for any dates that might be interpreted incorrectly
-- Look for dates where day > 12 (these should be fine)
-- and dates where day <= 12 (these might be ambiguous)
SELECT 
  id,
  booking_date,
  EXTRACT(day FROM booking_date) as day,
  EXTRACT(month FROM booking_date) as month,
  CASE 
    WHEN EXTRACT(day FROM booking_date) <= 12 THEN 'Potentially Ambiguous'
    ELSE 'Clear (day > 12)'
  END as date_clarity,
  session_type
FROM sessions 
ORDER BY booking_date DESC;

-- Show timezone info
SELECT 
  id,
  booking_date,
  booking_date AT TIME ZONE 'UTC' as utc_time,
  booking_date AT TIME ZONE 'Europe/London' as london_time,
  session_type
FROM sessions 
ORDER BY booking_date DESC
LIMIT 5;
