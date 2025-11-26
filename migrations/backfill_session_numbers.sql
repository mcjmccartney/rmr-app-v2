-- Backfill session_number for all existing Online and In-Person sessions
-- This script calculates and updates session numbers based on client_id and booking date/time

-- Update session numbers for all Online and In-Person sessions
WITH ranked_sessions AS (
  SELECT 
    id,
    client_id,
    session_type,
    booking_date,
    booking_time,
    ROW_NUMBER() OVER (
      PARTITION BY client_id 
      ORDER BY booking_date, booking_time
    ) as session_num
  FROM sessions
  WHERE session_type IN ('Online', 'In-Person')
    AND client_id IS NOT NULL
)
UPDATE sessions
SET session_number = ranked_sessions.session_num
FROM ranked_sessions
WHERE sessions.id = ranked_sessions.id;

-- Verify the results
SELECT 
  s.id,
  c.first_name,
  c.last_name,
  s.session_type,
  s.booking_date,
  s.booking_time,
  s.session_number
FROM sessions s
LEFT JOIN clients c ON s.client_id = c.id
WHERE s.session_type IN ('Online', 'In-Person')
  AND s.client_id IS NOT NULL
ORDER BY c.last_name, c.first_name, s.booking_date, s.booking_time;

