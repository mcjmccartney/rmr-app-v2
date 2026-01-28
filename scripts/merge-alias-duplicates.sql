-- Merge Duplicate Clients Created from Alias Emails
-- 
-- IMPORTANT: This script will DELETE duplicate client records after merging their data.
-- Review the output of find-alias-duplicates.sql BEFORE running this script!
--
-- This script:
-- 1. Transfers all sessions from duplicate clients to primary clients
-- 2. Updates membership records to point to primary clients
-- 3. Deletes the duplicate client records
--
-- Usage:
--   1. First run find-alias-duplicates.sql to identify duplicates
--   2. Review the results carefully
--   3. Run this script to merge them
--
-- Run this in your Supabase SQL Editor

-- Step 1: Create a temporary table to store the duplicates we're going to merge
CREATE TEMP TABLE duplicates_to_merge AS
SELECT 
  c.id as duplicate_client_id,
  cea.client_id as primary_client_id,
  c.email as duplicate_email,
  c.first_name || ' ' || c.last_name as duplicate_name,
  c2.first_name || ' ' || c2.last_name as primary_name
FROM clients c
INNER JOIN client_email_aliases cea ON c.email = cea.email
INNER JOIN clients c2 ON cea.client_id = c2.id
WHERE c.id != cea.client_id;

-- Step 2: Show what will be merged
SELECT 
  'PREVIEW: ' || COUNT(*) || ' duplicate clients will be merged' as status
FROM duplicates_to_merge;

SELECT 
  duplicate_name,
  duplicate_email,
  '→ will be merged into →' as action,
  primary_name
FROM duplicates_to_merge
ORDER BY duplicate_name;

-- Step 3: Transfer sessions from duplicate clients to primary clients
UPDATE sessions s
SET client_id = dtm.primary_client_id
FROM duplicates_to_merge dtm
WHERE s.client_id = dtm.duplicate_client_id;

-- Show how many sessions were transferred
SELECT 
  'Transferred ' || COUNT(*) || ' sessions' as status
FROM sessions s
INNER JOIN duplicates_to_merge dtm ON s.client_id = dtm.primary_client_id
WHERE s.client_id IN (SELECT primary_client_id FROM duplicates_to_merge);

-- Step 4: Update memberships (if client_id column exists)
-- Note: Some membership tables only have email, not client_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'memberships' AND column_name = 'client_id'
  ) THEN
    UPDATE memberships m
    SET client_id = dtm.primary_client_id
    FROM duplicates_to_merge dtm
    WHERE m.email = dtm.duplicate_email;
    
    RAISE NOTICE 'Updated memberships with client_id';
  ELSE
    RAISE NOTICE 'Memberships table does not have client_id column - skipping';
  END IF;
END $$;

-- Step 5: Transfer behavioural briefs
UPDATE behavioural_briefs bb
SET client_id = dtm.primary_client_id
FROM duplicates_to_merge dtm
WHERE bb.client_id = dtm.duplicate_client_id;

-- Step 6: Transfer behaviour questionnaires
UPDATE behaviour_questionnaires bq
SET client_id = dtm.primary_client_id
FROM duplicates_to_merge dtm
WHERE bq.client_id = dtm.duplicate_client_id;

-- Step 7: Delete the duplicate client records
-- (CASCADE will handle related records that weren't transferred)
DELETE FROM clients
WHERE id IN (SELECT duplicate_client_id FROM duplicates_to_merge);

-- Step 8: Show final summary
SELECT 
  'Successfully merged and deleted ' || COUNT(*) || ' duplicate clients' as status
FROM duplicates_to_merge;

-- Step 9: Verify no duplicates remain
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No duplicates remaining!'
    ELSE '⚠️  ' || COUNT(*) || ' duplicates still found - please review'
  END as verification_status
FROM clients c
INNER JOIN client_email_aliases cea ON c.email = cea.email
WHERE c.id != cea.client_id;

-- Clean up temp table
DROP TABLE IF EXISTS duplicates_to_merge;

-- Final message
SELECT '✅ Merge complete! Please verify the results above.' as final_status;

