-- SQL Query to Link Sessions to Clients by Email
-- Run this in your Supabase SQL Editor

-- First, let's see what we're working with (optional - for verification)
-- Uncomment these lines to check your data before running the update:

-- SELECT 
--   s.id as session_id,
--   s.email as session_email,
--   s.client_id as current_client_id,
--   c.id as matching_client_id,
--   c.email as client_email,
--   c.first_name,
--   c.last_name
-- FROM sessions s
-- LEFT JOIN clients c ON LOWER(s.email) = LOWER(c.email)
-- WHERE s.email IS NOT NULL
-- ORDER BY s.email;

-- Update sessions table to link with clients based on matching emails
UPDATE sessions 
SET client_id = clients.id
FROM clients 
WHERE LOWER(sessions.email) = LOWER(clients.email)
  AND sessions.email IS NOT NULL
  AND clients.email IS NOT NULL;

-- Verification query - shows sessions that were successfully linked
SELECT 
  s.id as session_id,
  s.email as session_email,
  s.client_id,
  c.first_name,
  c.last_name,
  c.email as client_email,
  s.session_type,
  s.booking_date
FROM sessions s
JOIN clients c ON s.client_id = c.id
ORDER BY s.booking_date DESC;

-- Check for sessions that couldn't be linked (no matching client email)
SELECT 
  s.id as session_id,
  s.email as session_email,
  s.client_id,
  s.session_type,
  s.booking_date
FROM sessions s
WHERE s.client_id IS NULL 
  AND s.email IS NOT NULL
ORDER BY s.booking_date DESC;

-- Summary of linking results
SELECT 
  COUNT(*) as total_sessions,
  COUNT(client_id) as linked_sessions,
  COUNT(*) - COUNT(client_id) as unlinked_sessions
FROM sessions;
