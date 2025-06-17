-- Comprehensive Behavioural Briefs Update Script
-- This script handles all edge cases and provides detailed logging

-- Step 1: Ensure client_id column exists with proper constraints
DO $$
BEGIN
    -- Add client_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'behavioural_briefs' 
        AND column_name = 'client_id'
    ) THEN
        ALTER TABLE behavioural_briefs 
        ADD COLUMN client_id UUID REFERENCES clients(id);
        
        RAISE NOTICE 'Added client_id column to behavioural_briefs table';
    ELSE
        RAISE NOTICE 'client_id column already exists';
    END IF;
END $$;

-- Step 2: Create a temporary log table for tracking changes
CREATE TEMP TABLE update_log (
    action_type TEXT,
    brief_id UUID,
    email TEXT,
    old_contact_number TEXT,
    new_contact_number TEXT,
    client_id UUID,
    client_name TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Step 3: Update client_id by matching email addresses (case-insensitive)
WITH email_matches AS (
    SELECT 
        bb.id as brief_id,
        bb.email as brief_email,
        c.id as client_id,
        c.first_name || ' ' || c.last_name as client_name
    FROM behavioural_briefs bb
    INNER JOIN clients c ON LOWER(TRIM(bb.email)) = LOWER(TRIM(c.email))
    WHERE bb.client_id IS NULL
    AND bb.email IS NOT NULL
    AND c.email IS NOT NULL
),
update_result AS (
    UPDATE behavioural_briefs 
    SET client_id = em.client_id
    FROM email_matches em
    WHERE behavioural_briefs.id = em.brief_id
    RETURNING id, email, client_id
)
INSERT INTO update_log (action_type, brief_id, email, client_id, client_name)
SELECT 
    'CLIENT_PAIRED',
    ur.id,
    ur.email,
    ur.client_id,
    c.first_name || ' ' || c.last_name
FROM update_result ur
JOIN clients c ON ur.client_id = c.id;

-- Step 4: Format contact numbers - add preceding 0 if only 10 digits
WITH contact_updates AS (
    UPDATE behavioural_briefs 
    SET contact_number = '0' || contact_number
    WHERE LENGTH(REGEXP_REPLACE(contact_number, '[^0-9]', '', 'g')) = 10
    AND contact_number NOT LIKE '0%'
    AND contact_number IS NOT NULL
    AND contact_number != ''
    RETURNING id, email, '0' || contact_number as new_contact_number, 
              SUBSTRING(contact_number FROM 2) as old_contact_number
)
INSERT INTO update_log (action_type, brief_id, email, old_contact_number, new_contact_number)
SELECT 
    'CONTACT_FORMATTED',
    id,
    email,
    old_contact_number,
    new_contact_number
FROM contact_updates;

-- Step 5: Show detailed results
SELECT 
    '=== UPDATE SUMMARY ===' as summary_section,
    '' as detail;

-- Show pairing results
SELECT 
    'CLIENT PAIRING RESULTS' as summary_section,
    COUNT(*) || ' behavioural briefs paired with clients' as detail
FROM update_log 
WHERE action_type = 'CLIENT_PAIRED'

UNION ALL

SELECT 
    'CONTACT FORMATTING RESULTS' as summary_section,
    COUNT(*) || ' contact numbers formatted with preceding 0' as detail
FROM update_log 
WHERE action_type = 'CONTACT_FORMATTED';

-- Step 6: Show current state after updates
SELECT 
    '=== CURRENT STATE ===' as section,
    '' as metric,
    '' as value

UNION ALL

SELECT 
    'TOTALS' as section,
    'Total behavioural briefs' as metric,
    COUNT(*)::text as value
FROM behavioural_briefs

UNION ALL

SELECT 
    'PAIRING STATUS' as section,
    'Successfully paired with clients' as metric,
    COUNT(client_id)::text as value
FROM behavioural_briefs

UNION ALL

SELECT 
    'PAIRING STATUS' as section,
    'Not paired (no matching email)' as metric,
    (COUNT(*) - COUNT(client_id))::text as value
FROM behavioural_briefs

UNION ALL

SELECT 
    'PAIRING STATUS' as section,
    'Pairing success rate' as metric,
    ROUND((COUNT(client_id)::decimal / COUNT(*)) * 100, 1)::text || '%' as value
FROM behavioural_briefs;

-- Step 7: Show detailed pairing results
SELECT
    bb.email,
    bb.contact_number,
    c.first_name || ' ' || c.last_name as client_name,
    c.dog_name,
    bb.created_at::date as brief_date
FROM behavioural_briefs bb
JOIN clients c ON bb.client_id = c.id
ORDER BY bb.created_at DESC;

-- Step 8: Show unpaired briefs that need manual attention
SELECT
    bb.email,
    bb.contact_number,
    bb.created_at::date as brief_date,
    'No matching client email found' as reason
FROM behavioural_briefs bb
WHERE bb.client_id IS NULL
ORDER BY bb.created_at DESC;

-- Step 9: Show the update log
SELECT
    action_type,
    email,
    COALESCE(old_contact_number, '') as old_contact,
    COALESCE(new_contact_number, '') as new_contact,
    COALESCE(client_name, '') as paired_client,
    timestamp::time as update_time
FROM update_log
ORDER BY timestamp;

-- Clean up temp table
DROP TABLE update_log;
