-- Fix Future Dates Issue - Day/Month Swap Problem
-- This script identifies and fixes sessions with incorrect future dates

-- STEP 1: Identify the problem - sessions in the future that shouldn't exist
SELECT 
  id,
  booking_date,
  EXTRACT(year FROM booking_date) as year,
  EXTRACT(month FROM booking_date) as month,
  EXTRACT(day FROM booking_date) as day,
  session_type,
  CASE 
    WHEN booking_date > NOW() THEN 'FUTURE DATE (SUSPICIOUS)'
    ELSE 'PAST/CURRENT DATE (OK)'
  END as date_status
FROM sessions 
WHERE booking_date > NOW()
ORDER BY booking_date;

-- STEP 2: Check if swapping day and month would make dates reasonable
SELECT 
  id,
  booking_date as original_date,
  EXTRACT(year FROM booking_date) as year,
  EXTRACT(month FROM booking_date) as original_month,
  EXTRACT(day FROM booking_date) as original_day,
  -- Create swapped date (swap day and month)
  (EXTRACT(year FROM booking_date)::text || '-' ||
   LPAD(EXTRACT(day FROM booking_date)::text, 2, '0') || '-' ||
   LPAD(EXTRACT(month FROM booking_date)::text, 2, '0') || ' ' ||
   LPAD(EXTRACT(hour FROM booking_date)::text, 2, '0') || ':' ||
   LPAD(EXTRACT(minute FROM booking_date)::text, 2, '0') || ':' ||
   LPAD(EXTRACT(second FROM booking_date)::text, 2, '0'))::timestamp as swapped_date,
  session_type
FROM sessions 
WHERE booking_date > NOW()
  AND EXTRACT(day FROM booking_date) <= 12  -- Only swap if day could be a valid month
  AND EXTRACT(month FROM booking_date) <= 12 -- Only swap if month could be a valid day
ORDER BY booking_date;

-- STEP 3: Fix the dates by swapping day and month for future dates
-- UNCOMMENT THE FOLLOWING QUERY TO APPLY THE FIX:

UPDATE sessions 
SET booking_date = (
  EXTRACT(year FROM booking_date)::text || '-' ||
  LPAD(EXTRACT(day FROM booking_date)::text, 2, '0') || '-' ||
  LPAD(EXTRACT(month FROM booking_date)::text, 2, '0') || ' ' ||
  LPAD(EXTRACT(hour FROM booking_date)::text, 2, '0') || ':' ||
  LPAD(EXTRACT(minute FROM booking_date)::text, 2, '0') || ':' ||
  LPAD(EXTRACT(second FROM booking_date)::text, 2, '0')
)::timestamp
WHERE booking_date > NOW()
  AND EXTRACT(day FROM booking_date) <= 12
  AND EXTRACT(month FROM booking_date) <= 12;

-- STEP 4: Verify the fix worked
SELECT 
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN booking_date > NOW() THEN 1 END) as future_sessions,
  COUNT(CASE WHEN booking_date <= NOW() THEN 1 END) as past_current_sessions,
  MIN(booking_date) as earliest_session,
  MAX(booking_date) as latest_session
FROM sessions;

-- STEP 5: Show sessions by month after the fix
SELECT 
  TO_CHAR(booking_date, 'YYYY-MM') as month,
  COUNT(*) as session_count,
  SUM(quote) as total_revenue
FROM sessions 
GROUP BY TO_CHAR(booking_date, 'YYYY-MM')
ORDER BY month DESC;

-- STEP 6: Check for any remaining problematic dates
SELECT 
  id,
  booking_date,
  session_type,
  quote
FROM sessions 
WHERE booking_date > NOW() + INTERVAL '1 month'  -- Sessions more than 1 month in future
ORDER BY booking_date;
