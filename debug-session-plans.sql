-- Debug Session Plans and Session Numbers
-- Let's see what we're working with

-- 1. Check all session plans
SELECT 
  'Session Plans' as table_name,
  COUNT(*) as total_count
FROM session_plans;

-- 2. Check session plans with their session info
SELECT 
  sp.id as session_plan_id,
  sp.session_id,
  sp.session_number,
  s.id as session_db_id,
  s.client_id,
  s.booking_date,
  s.booking_time,
  s.session_type
FROM session_plans sp
LEFT JOIN sessions s ON sp.session_id = s.id
ORDER BY sp.id;

-- 3. Check if there are sessions without session plans
SELECT 
  s.id as session_id,
  s.client_id,
  s.booking_date,
  s.booking_time,
  s.session_type,
  CASE 
    WHEN sp.id IS NOT NULL THEN 'Has Session Plan'
    ELSE 'No Session Plan'
  END as plan_status
FROM sessions s
LEFT JOIN session_plans sp ON s.id = sp.session_id
ORDER BY s.client_id, s.booking_date, s.booking_time;

-- 4. Check clients and their sessions
SELECT 
  c.id as client_id,
  c.first_name,
  c.last_name,
  c.dog_name,
  COUNT(s.id) as total_sessions,
  COUNT(sp.id) as sessions_with_plans
FROM clients c
LEFT JOIN sessions s ON c.id = s.client_id
LEFT JOIN session_plans sp ON s.id = sp.session_id
GROUP BY c.id, c.first_name, c.last_name, c.dog_name
ORDER BY c.first_name, c.last_name;

-- 5. Check for any data type issues with session_id
SELECT 
  sp.session_id,
  pg_typeof(sp.session_id) as session_id_type,
  s.id,
  pg_typeof(s.id) as session_db_id_type
FROM session_plans sp
LEFT JOIN sessions s ON sp.session_id = s.id
LIMIT 5;

-- 6. Try to manually match session plans to sessions
SELECT 
  sp.id as session_plan_id,
  sp.session_id as sp_session_id,
  s.id as session_id,
  CASE 
    WHEN sp.session_id = s.id THEN 'MATCH'
    WHEN sp.session_id::text = s.id::text THEN 'TEXT_MATCH'
    ELSE 'NO_MATCH'
  END as match_status
FROM session_plans sp
CROSS JOIN sessions s
WHERE sp.session_id = s.id OR sp.session_id::text = s.id::text
ORDER BY sp.id;
