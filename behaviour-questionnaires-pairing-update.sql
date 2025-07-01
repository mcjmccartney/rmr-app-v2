-- Behaviour Questionnaires Client Pairing and Contact Formatting Script
-- This script pairs behaviour_questionnaires with clients by email and formats contact numbers

-- Step 1: Create a temporary log table to track our updates
CREATE TEMP TABLE update_log (
    id SERIAL PRIMARY KEY,
    action_type VARCHAR(50),
    questionnaire_id UUID,
    client_id UUID,
    email VARCHAR(255),
    old_contact VARCHAR(50),
    new_contact VARCHAR(50),
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Step 2: Show current state BEFORE updates
SELECT 'BEFORE UPDATE - Current State' as status;

SELECT 
    COUNT(*) as total_behaviour_questionnaires,
    COUNT(client_id) as already_paired,
    COUNT(*) - COUNT(client_id) as need_pairing
FROM behaviour_questionnaires;

SELECT 
    'Contact Numbers Analysis' as analysis_type,
    COUNT(*) as total_contacts,
    COUNT(CASE WHEN LENGTH(contact_number) = 10 AND contact_number ~ '^[0-9]+$' THEN 1 END) as ten_digit_numbers,
    COUNT(CASE WHEN LENGTH(contact_number) = 11 AND LEFT(contact_number, 1) = '0' THEN 1 END) as already_formatted
FROM behaviour_questionnaires;

-- Step 3: Pair behaviour questionnaires with existing clients by email
WITH questionnaire_client_matches AS (
    SELECT 
        bq.id as questionnaire_id,
        bq.email as questionnaire_email,
        c.id as client_id,
        c.email as client_email,
        c.first_name || ' ' || c.last_name as client_name
    FROM behaviour_questionnaires bq
    JOIN clients c ON LOWER(TRIM(bq.email)) = LOWER(TRIM(c.email))
    WHERE bq.client_id IS NULL
)
UPDATE behaviour_questionnaires 
SET client_id = questionnaire_client_matches.client_id
FROM questionnaire_client_matches
WHERE behaviour_questionnaires.id = questionnaire_client_matches.questionnaire_id;

-- Log the pairing actions
INSERT INTO update_log (action_type, questionnaire_id, client_id, email)
SELECT 
    'CLIENT_PAIRED',
    bq.id,
    bq.client_id,
    bq.email
FROM behaviour_questionnaires bq
WHERE bq.client_id IS NOT NULL
AND bq.id IN (
    SELECT bq2.id 
    FROM behaviour_questionnaires bq2
    JOIN clients c ON LOWER(TRIM(bq2.email)) = LOWER(TRIM(c.email))
    WHERE bq2.client_id = c.id
);

-- Step 4: Format contact numbers - add preceding 0 to 10-digit numbers
WITH contact_updates AS (
    SELECT 
        id,
        contact_number as old_contact,
        '0' || contact_number as new_contact
    FROM behaviour_questionnaires
    WHERE LENGTH(contact_number) = 10 
    AND contact_number ~ '^[0-9]+$'
    AND LEFT(contact_number, 1) != '0'
)
UPDATE behaviour_questionnaires
SET contact_number = contact_updates.new_contact
FROM contact_updates
WHERE behaviour_questionnaires.id = contact_updates.id;

-- Log the contact formatting actions
INSERT INTO update_log (action_type, questionnaire_id, old_contact, new_contact)
SELECT 
    'CONTACT_FORMATTED',
    bq.id,
    ul.old_contact,
    bq.contact_number
FROM behaviour_questionnaires bq
JOIN (
    SELECT 
        id,
        contact_number as old_contact
    FROM behaviour_questionnaires
    WHERE LENGTH(contact_number) = 11 
    AND LEFT(contact_number, 1) = '0'
    AND SUBSTRING(contact_number, 2) ~ '^[0-9]{10}$'
) ul ON bq.id = ul.id;

-- Step 5: Show summary of actions taken
SELECT 
    'PAIRING RESULTS' as summary_section,
    COUNT(*) || ' behaviour questionnaires paired with clients' as detail
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
    '=== CURRENT STATE AFTER UPDATES ===' as section,
    '' as metric,
    '' as value

UNION ALL

SELECT 
    'TOTALS' as section,
    'Total behaviour questionnaires' as metric,
    COUNT(*)::text as value
FROM behaviour_questionnaires

UNION ALL

SELECT 
    'PAIRING STATUS' as section,
    'Paired with clients' as metric,
    COUNT(client_id)::text as value
FROM behaviour_questionnaires

UNION ALL

SELECT 
    'PAIRING STATUS' as section,
    'Still unpaired' as metric,
    (COUNT(*) - COUNT(client_id))::text as value
FROM behaviour_questionnaires

UNION ALL

SELECT 
    'CONTACT FORMATTING' as section,
    'Properly formatted (11 digits starting with 0)' as metric,
    COUNT(CASE WHEN LENGTH(contact_number) = 11 AND LEFT(contact_number, 1) = '0' THEN 1 END)::text as value
FROM behaviour_questionnaires

UNION ALL

SELECT 
    'CONTACT FORMATTING' as section,
    'Still need formatting (10 digits)' as metric,
    COUNT(CASE WHEN LENGTH(contact_number) = 10 AND contact_number ~ '^[0-9]+$' THEN 1 END)::text as value
FROM behaviour_questionnaires;

-- Step 7: Show detailed breakdown of unpaired questionnaires
SELECT 
    '=== UNPAIRED QUESTIONNAIRES ANALYSIS ===' as analysis_header,
    '' as email,
    '' as reason

UNION ALL

SELECT 
    'UNPAIRED QUESTIONNAIRE' as analysis_header,
    bq.email as email,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM clients c WHERE LOWER(TRIM(c.email)) = LOWER(TRIM(bq.email))) 
        THEN 'No matching client email found'
        ELSE 'Other reason'
    END as reason
FROM behaviour_questionnaires bq
WHERE bq.client_id IS NULL
ORDER BY analysis_header, email;

-- Step 8: Show sample of successfully paired questionnaires
SELECT 
    '=== SAMPLE PAIRED QUESTIONNAIRES ===' as sample_header,
    '' as questionnaire_info,
    '' as client_info

UNION ALL

SELECT 
    'PAIRED QUESTIONNAIRE' as sample_header,
    bq.owner_first_name || ' ' || bq.owner_last_name || ' (' || bq.email || ')' as questionnaire_info,
    c.first_name || ' ' || c.last_name || ' (' || c.email || ')' as client_info
FROM behaviour_questionnaires bq
JOIN clients c ON bq.client_id = c.id
LIMIT 10;
