-- Fix Session Numbers - More Robust Approach
-- This handles potential data type mismatches and other issues

-- First, let's see what we're working with (run this first)
SELECT 
  'Current session plans count:' as info,
  COUNT(*) as count
FROM session_plans;

SELECT 
  'Session plans with valid session_id:' as info,
  COUNT(*) as count
FROM session_plans sp
JOIN sessions s ON sp.session_id = s.id;

-- Check for session_id data type issues
SELECT 
  sp.id,
  sp.session_id,
  pg_typeof(sp.session_id) as session_id_type,
  s.id as matched_session_id,
  pg_typeof(s.id) as session_db_id_type
FROM session_plans sp
LEFT JOIN sessions s ON sp.session_id = s.id
LIMIT 10;

-- Method 1: Direct update (if session_id types match)
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

-- Method 2: Update with text casting (if there are type mismatches)
-- UNCOMMENT IF METHOD 1 DOESN'T WORK:
/*
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
  JOIN sessions s ON sp.session_id::text = s.id::text
) ranked_sessions
WHERE session_plans.id = ranked_sessions.session_plan_id;
*/

-- Method 3: Update with UUID casting (if session_id is UUID)
-- UNCOMMENT IF METHODS 1 & 2 DON'T WORK:
/*
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
  JOIN sessions s ON sp.session_id::uuid = s.id::uuid
) ranked_sessions
WHERE session_plans.id = ranked_sessions.session_plan_id;
*/

-- Verification: Check the results
SELECT 
  sp.id as session_plan_id,
  sp.session_id,
  sp.session_number,
  s.client_id,
  s.booking_date,
  s.booking_time,
  c.first_name,
  c.last_name,
  c.dog_name
FROM session_plans sp
JOIN sessions s ON sp.session_id = s.id
JOIN clients c ON s.client_id = c.id
ORDER BY c.first_name, c.last_name, s.booking_date, s.booking_time;

-- Final count
SELECT 
  'Total session plans updated:' as description,
  COUNT(*) as count
FROM session_plans 
WHERE session_number IS NOT NULL AND session_number > 0;
