-- Mark all sessions before 1st July 2025 as Session Plan Sent
-- This script updates the session_plan_sent field to true for all sessions
-- with booking_date before 2025-07-01

-- First, let's see what we're working with (optional check)
SELECT 
  COUNT(*) as total_sessions_before_july,
  COUNT(CASE WHEN session_plan_sent = true THEN 1 END) as already_marked_sent,
  COUNT(CASE WHEN session_plan_sent = false OR session_plan_sent IS NULL THEN 1 END) as to_be_updated
FROM sessions 
WHERE booking_date < '2025-07-01';

-- Update all sessions before July 1st, 2025 to mark session_plan_sent as true
UPDATE sessions 
SET 
  session_plan_sent = true,
  updated_at = NOW()
WHERE 
  booking_date < '2025-07-01'
  AND (session_plan_sent = false OR session_plan_sent IS NULL);

-- Verify the update
SELECT 
  COUNT(*) as total_sessions_before_july,
  COUNT(CASE WHEN session_plan_sent = true THEN 1 END) as marked_as_sent,
  COUNT(CASE WHEN session_plan_sent = false OR session_plan_sent IS NULL THEN 1 END) as not_sent
FROM sessions 
WHERE booking_date < '2025-07-01';

-- Show some sample updated records
SELECT 
  id,
  booking_date,
  booking_time,
  session_type,
  session_plan_sent,
  updated_at
FROM sessions 
WHERE booking_date < '2025-07-01'
ORDER BY booking_date DESC
LIMIT 10;
