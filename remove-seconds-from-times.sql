-- Remove Seconds from All Time Values in Sessions Table
-- This script will update all existing time values to HH:mm format (removing seconds)

-- STEP 1: Check current time formats
SELECT 
  id,
  booking_time,
  LENGTH(booking_time::text) as time_length,
  CASE 
    WHEN LENGTH(booking_time::text) > 5 THEN 'Has Seconds'
    ELSE 'No Seconds'
  END as format_status
FROM sessions 
ORDER BY booking_time DESC
LIMIT 10;

-- STEP 2: Show what the update will do (preview)
SELECT 
  id,
  booking_time as current_time,
  SUBSTRING(booking_time::text, 1, 5) as new_time,
  session_type
FROM sessions 
WHERE LENGTH(booking_time::text) > 5
ORDER BY booking_time DESC
LIMIT 10;

-- STEP 3: Update all time values to remove seconds
-- This converts HH:mm:ss to HH:mm format
UPDATE sessions 
SET booking_time = SUBSTRING(booking_time::text, 1, 5)::time
WHERE LENGTH(booking_time::text) > 5;

-- STEP 4: Verify the update worked
SELECT 
  id,
  booking_time,
  LENGTH(booking_time::text) as time_length,
  session_type
FROM sessions 
ORDER BY booking_time DESC
LIMIT 10;

-- STEP 5: Check that all times are now in HH:mm format
SELECT 
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN LENGTH(booking_time::text) = 5 THEN 1 END) as correct_format,
  COUNT(CASE WHEN LENGTH(booking_time::text) > 5 THEN 1 END) as still_has_seconds
FROM sessions;
