-- Analysis Script for Behavioural Briefs Data
-- Run this BEFORE the update script to see current state

-- 1. Current state of behavioural_briefs table
SELECT 
    'Current behavioural_briefs count' as metric,
    COUNT(*) as value
FROM behavioural_briefs

UNION ALL

SELECT 
    'Briefs with client_id already set' as metric,
    COUNT(*) as value
FROM behavioural_briefs 
WHERE client_id IS NOT NULL

UNION ALL

SELECT 
    'Briefs without client_id' as metric,
    COUNT(*) as value
FROM behavioural_briefs 
WHERE client_id IS NULL;

-- 2. Email matching analysis
SELECT 
    'Emails in behavioural_briefs' as metric,
    COUNT(DISTINCT email) as value
FROM behavioural_briefs 
WHERE email IS NOT NULL

UNION ALL

SELECT 
    'Emails in clients table' as metric,
    COUNT(DISTINCT email) as value
FROM clients 
WHERE email IS NOT NULL

UNION ALL

SELECT 
    'Matching emails (can be paired)' as metric,
    COUNT(*) as value
FROM (
    SELECT bb.email
    FROM behavioural_briefs bb
    INNER JOIN clients c ON bb.email = c.email
    WHERE bb.email IS NOT NULL
    GROUP BY bb.email
) matched_emails;

-- 3. Contact number analysis
SELECT 
    'Total contact numbers' as metric,
    COUNT(*) as value
FROM behavioural_briefs 
WHERE contact_number IS NOT NULL

UNION ALL

SELECT 
    'Contact numbers with 10 digits' as metric,
    COUNT(*) as value
FROM behavioural_briefs 
WHERE LENGTH(REGEXP_REPLACE(contact_number, '[^0-9]', '', 'g')) = 10
AND contact_number IS NOT NULL

UNION ALL

SELECT 
    'Contact numbers with 11 digits' as metric,
    COUNT(*) as value
FROM behavioural_briefs 
WHERE LENGTH(REGEXP_REPLACE(contact_number, '[^0-9]', '', 'g')) = 11
AND contact_number IS NOT NULL

UNION ALL

SELECT 
    '10-digit numbers NOT starting with 0' as metric,
    COUNT(*) as value
FROM behavioural_briefs 
WHERE LENGTH(REGEXP_REPLACE(contact_number, '[^0-9]', '', 'g')) = 10
AND contact_number NOT LIKE '0%'
AND contact_number IS NOT NULL;

-- 4. Show sample data for review
SELECT
    bb.id::text as brief_id,
    bb.email,
    bb.contact_number,
    COALESCE(c.first_name || ' ' || c.last_name, 'No match') as potential_client_match,
    bb.created_at
FROM behavioural_briefs bb
LEFT JOIN clients c ON bb.email = c.email
ORDER BY bb.created_at DESC
LIMIT 10;

-- 5. Show emails that won't match
SELECT
    bb.id::text as brief_id,
    bb.email,
    bb.contact_number,
    'Not found in clients table' as reason,
    bb.created_at
FROM behavioural_briefs bb
LEFT JOIN clients c ON bb.email = c.email
WHERE c.email IS NULL
AND bb.email IS NOT NULL
ORDER BY bb.created_at DESC;
