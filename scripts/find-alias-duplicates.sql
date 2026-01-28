-- Find Duplicate Clients Created from Alias Emails
-- Run this in your Supabase SQL Editor to identify duplicate clients

-- This query finds clients whose email exists in the client_email_aliases table
-- but the client record is NOT the same as the linked client (meaning it's a duplicate)

SELECT 
  c.id as duplicate_client_id,
  c.first_name || ' ' || c.last_name as duplicate_client_name,
  c.email as duplicate_client_email,
  c.dog_name as duplicate_client_dog,
  c.created_at as duplicate_created_at,
  c.membership as duplicate_has_membership,
  
  cea.client_id as primary_client_id,
  c2.first_name || ' ' || c2.last_name as primary_client_name,
  c2.email as primary_client_email,
  c2.dog_name as primary_client_dog,
  c2.created_at as primary_created_at,
  
  cea.email as alias_email,
  cea.is_primary as alias_is_primary,
  
  -- Count related records for the duplicate
  (SELECT COUNT(*) FROM sessions WHERE client_id = c.id) as duplicate_sessions_count,
  (SELECT COUNT(*) FROM memberships WHERE email = c.email) as duplicate_memberships_count

FROM clients c
INNER JOIN client_email_aliases cea ON c.email = cea.email
INNER JOIN clients c2 ON cea.client_id = c2.id

-- The duplicate client is NOT the same as the primary client
WHERE c.id != cea.client_id

ORDER BY c.created_at DESC;


-- Optional: Get a summary count
SELECT 
  COUNT(*) as total_duplicates_found,
  COUNT(DISTINCT c.id) as unique_duplicate_clients,
  COUNT(DISTINCT cea.client_id) as unique_primary_clients
FROM clients c
INNER JOIN client_email_aliases cea ON c.email = cea.email
INNER JOIN clients c2 ON cea.client_id = c2.id
WHERE c.id != cea.client_id;

