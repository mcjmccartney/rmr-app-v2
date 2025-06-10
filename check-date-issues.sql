-- Quick Check for Date Issues
-- Run this first to see what's wrong with your dates

-- Show all sessions with future dates (these are likely wrong)
SELECT 
  id,
  booking_date,
  EXTRACT(month FROM booking_date) as month,
  EXTRACT(day FROM booking_date) as day,
  session_type,
  'FUTURE DATE - LIKELY WRONG' as issue
FROM sessions 
WHERE booking_date > NOW()
ORDER BY booking_date
LIMIT 20;

-- Show what these dates would look like if we swap day and month
SELECT 
  id,
  booking_date as wrong_date,
  (EXTRACT(year FROM booking_date)::text || '-' ||
   LPAD(EXTRACT(day FROM booking_date)::text, 2, '0') || '-' ||
   LPAD(EXTRACT(month FROM booking_date)::text, 2, '0') || ' ' ||
   TO_CHAR(booking_date, 'HH24:MI:SS'))::timestamp as corrected_date,
  session_type
FROM sessions 
WHERE booking_date > NOW()
  AND EXTRACT(day FROM booking_date) <= 12
ORDER BY booking_date
LIMIT 10;

-- Count sessions by year to see the scope of the problem
SELECT 
  EXTRACT(year FROM booking_date) as year,
  COUNT(*) as session_count
FROM sessions 
GROUP BY EXTRACT(year FROM booking_date)
ORDER BY year;
