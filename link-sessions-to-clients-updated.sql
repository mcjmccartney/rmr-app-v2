-- Link Sessions to Clients by Email (Updated for Separate Date/Time Structure)
-- Run this in your Supabase SQL Editor

-- STEP 1: Check what we're working with
-- See sessions that need to be linked
SELECT 
  s.id as session_id,
  s.email as session_email,
  s.client_id as current_client_id,
  s.booking_date,
  s.booking_time,
  s.session_type,
  s.quote
FROM sessions s
WHERE s.email IS NOT NULL
ORDER BY s.booking_date DESC, s.booking_time DESC
LIMIT 10;

-- STEP 2: Preview the matches before updating
-- This shows which sessions will be linked to which clients
SELECT 
  s.id as session_id,
  s.email as session_email,
  s.client_id as current_client_id,
  c.id as matching_client_id,
  c.first_name,
  c.last_name,
  c.email as client_email,
  s.booking_date,
  s.booking_time,
  s.session_type
FROM sessions s
LEFT JOIN clients c ON LOWER(s.email) = LOWER(c.email)
WHERE s.email IS NOT NULL
ORDER BY s.booking_date DESC, s.booking_time DESC;

-- STEP 3: Update sessions to link with clients based on matching emails
UPDATE sessions 
SET client_id = clients.id
FROM clients 
WHERE LOWER(sessions.email) = LOWER(clients.email)
  AND sessions.email IS NOT NULL
  AND clients.email IS NOT NULL
  AND sessions.client_id IS NULL; -- Only update sessions that aren't already linked

-- STEP 4: Verification - Show successfully linked sessions
SELECT 
  s.id as session_id,
  s.email as session_email,
  s.client_id,
  c.first_name,
  c.last_name,
  c.email as client_email,
  s.booking_date,
  s.booking_time,
  s.session_type,
  s.quote
FROM sessions s
JOIN clients c ON s.client_id = c.id
ORDER BY s.booking_date DESC, s.booking_time DESC;

-- STEP 5: Check for sessions that couldn't be linked
SELECT 
  s.id as session_id,
  s.email as session_email,
  s.client_id,
  s.booking_date,
  s.booking_time,
  s.session_type,
  'NO MATCHING CLIENT' as issue
FROM sessions s
WHERE s.client_id IS NULL 
  AND s.email IS NOT NULL
ORDER BY s.booking_date DESC, s.booking_time DESC;

-- STEP 6: Summary of linking results
SELECT 
  COUNT(*) as total_sessions,
  COUNT(client_id) as linked_sessions,
  COUNT(*) - COUNT(client_id) as unlinked_sessions,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as sessions_with_email
FROM sessions;

-- STEP 7: Show sessions grouped by client (to verify the linking worked)
SELECT 
  c.first_name,
  c.last_name,
  c.email,
  COUNT(s.id) as session_count,
  SUM(s.quote) as total_revenue,
  MIN(s.booking_date) as earliest_session,
  MAX(s.booking_date) as latest_session
FROM clients c
LEFT JOIN sessions s ON c.id = s.client_id
GROUP BY c.id, c.first_name, c.last_name, c.email
HAVING COUNT(s.id) > 0
ORDER BY session_count DESC;

-- STEP 8: Clean up - Remove email column from sessions if no longer needed
-- UNCOMMENT THIS LINE AFTER VERIFYING EVERYTHING IS LINKED CORRECTLY:
-- ALTER TABLE sessions DROP COLUMN email;
