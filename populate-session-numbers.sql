-- Populate Session Numbers for Existing Session Plans
-- This script calculates and updates session_number for each session plan
-- based on the chronological order of sessions for each client

-- First, let's see what we're working with
SELECT 
  sp.id as session_plan_id,
  sp.session_id,
  s.client_id,
  s.booking_date,
  s.booking_time,
  c.first_name,
  c.last_name,
  c.dog_name,
  sp.session_number as current_session_number
FROM session_plans sp
JOIN sessions s ON sp.session_id = s.id
JOIN clients c ON s.client_id = c.id
ORDER BY c.first_name, c.last_name, s.booking_date, s.booking_time;

-- Update session_number for all existing session plans
-- This uses a window function to calculate the session number based on chronological order
UPDATE session_plans 
SET session_number = session_rank
FROM (
  SELECT 
    sp.id as session_plan_id,
    ROW_NUMBER() OVER (
      PARTITION BY s.client_id 
      ORDER BY s.booking_date, s.booking_time
    ) as session_rank
  FROM session_plans sp
  JOIN sessions s ON sp.session_id = s.id
) ranked_sessions
WHERE session_plans.id = ranked_sessions.session_plan_id;

-- Verify the update worked correctly
SELECT 
  sp.id as session_plan_id,
  sp.session_id,
  sp.session_number,
  s.client_id,
  s.booking_date,
  s.booking_time,
  c.first_name,
  c.last_name,
  c.dog_name,
  CONCAT(c.first_name, ' ', c.last_name, ' - Session ', sp.session_number) as display_name
FROM session_plans sp
JOIN sessions s ON sp.session_id = s.id
JOIN clients c ON s.client_id = c.id
ORDER BY c.first_name, c.last_name, sp.session_number;

-- Show summary by client
SELECT 
  c.first_name,
  c.last_name,
  c.dog_name,
  COUNT(sp.id) as total_session_plans,
  MIN(sp.session_number) as first_session,
  MAX(sp.session_number) as latest_session,
  STRING_AGG(sp.session_number::text, ', ' ORDER BY sp.session_number) as session_numbers
FROM clients c
LEFT JOIN sessions s ON c.id = s.client_id
LEFT JOIN session_plans sp ON s.id = sp.session_id
WHERE sp.id IS NOT NULL
GROUP BY c.id, c.first_name, c.last_name, c.dog_name
ORDER BY c.first_name, c.last_name;

-- Alternative approach if you want to update based on all sessions (not just those with session plans)
-- This would be useful if you want to ensure session numbers are consistent across all sessions
-- even if some don't have session plans yet

-- UNCOMMENT THE SECTION BELOW IF YOU WANT TO UPDATE BASED ON ALL SESSIONS:

/*
-- Create a temporary view of all sessions with their calculated session numbers
CREATE OR REPLACE VIEW session_numbers_view AS
SELECT 
  s.id as session_id,
  s.client_id,
  s.booking_date,
  s.booking_time,
  ROW_NUMBER() OVER (
    PARTITION BY s.client_id 
    ORDER BY s.booking_date, s.booking_time
  ) as calculated_session_number
FROM sessions s
ORDER BY s.client_id, s.booking_date, s.booking_time;

-- Update session plans using the calculated session numbers
UPDATE session_plans 
SET session_number = snv.calculated_session_number
FROM session_numbers_view snv
WHERE session_plans.session_id = snv.session_id;

-- Drop the temporary view
DROP VIEW session_numbers_view;
*/

-- Final verification query
SELECT 
  'Total session plans updated:' as description,
  COUNT(*) as count
FROM session_plans 
WHERE session_number IS NOT NULL AND session_number > 0;
