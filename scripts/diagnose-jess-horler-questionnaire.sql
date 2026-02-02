-- Diagnose Jess Horler's Questionnaire Issue
-- This script shows ALL the details to understand why the questionnaire isn't showing

-- Step 1: Show Jess Horler's client record
SELECT 
    '=== CLIENT RECORD ===' as section,
    id as client_id,
    first_name,
    last_name,
    email,
    dog_name as primary_dog,
    other_dogs,
    active,
    membership
FROM clients
WHERE first_name = 'Jess' 
    AND last_name = 'Horler';

-- Step 2: Show ALL questionnaires for Jess (by email OR client_id)
SELECT 
    '=== QUESTIONNAIRES ===' as section,
    id as questionnaire_id,
    client_id,
    owner_first_name,
    owner_last_name,
    email,
    dog_name,
    submitted_at
FROM behaviour_questionnaires
WHERE LOWER(TRIM(email)) = 'horlerjess@gmail.com'
    OR client_id IN (
        SELECT id FROM clients 
        WHERE first_name = 'Jess' AND last_name = 'Horler'
    )
ORDER BY submitted_at DESC;

-- Step 3: Show Jess's sessions with dog names
SELECT 
    '=== SESSIONS ===' as section,
    s.id as session_id,
    s.booking_date,
    s.booking_time,
    s.session_type,
    s.dog_name as session_dog_name,
    c.dog_name as client_primary_dog,
    c.other_dogs as client_other_dogs
FROM sessions s
JOIN clients c ON s.client_id = c.id
WHERE c.first_name = 'Jess' 
    AND c.last_name = 'Horler'
ORDER BY s.booking_date DESC
LIMIT 10;

-- Step 4: Show the EXACT matching logic
-- This simulates what the SessionModal does
WITH jess_client AS (
    SELECT * FROM clients 
    WHERE first_name = 'Jess' AND last_name = 'Horler'
    LIMIT 1
),
jess_questionnaires AS (
    SELECT * FROM behaviour_questionnaires
    WHERE LOWER(TRIM(email)) = 'horlerjess@gmail.com'
        OR client_id IN (SELECT id FROM jess_client)
)
SELECT 
    '=== MATCHING ANALYSIS ===' as section,
    jc.id as client_id,
    jc.email as client_email,
    jc.dog_name as client_dog,
    jq.id as questionnaire_id,
    jq.email as questionnaire_email,
    jq.dog_name as questionnaire_dog,
    jq.client_id as questionnaire_client_id,
    -- Check each matching method
    CASE WHEN jq.client_id = jc.id THEN '✅' ELSE '❌' END as client_id_match,
    CASE WHEN LOWER(TRIM(jq.email)) = LOWER(TRIM(jc.email)) THEN '✅' ELSE '❌' END as email_match,
    CASE WHEN LOWER(TRIM(jq.dog_name)) = LOWER(TRIM(jc.dog_name)) THEN '✅' ELSE '❌' END as dog_name_match_primary,
    -- Check if questionnaire dog matches any of the client's dogs
    CASE 
        WHEN LOWER(TRIM(jq.dog_name)) = LOWER(TRIM(jc.dog_name)) THEN '✅ PRIMARY'
        WHEN jc.other_dogs IS NOT NULL AND LOWER(jq.dog_name) = ANY(
            SELECT LOWER(TRIM(unnest(jc.other_dogs)))
        ) THEN '✅ OTHER'
        ELSE '❌ NO MATCH'
    END as dog_match_status
FROM jess_client jc
CROSS JOIN jess_questionnaires jq;

-- Step 5: Check for email aliases
SELECT 
    '=== EMAIL ALIASES ===' as section,
    cea.id as alias_id,
    cea.email as alias_email,
    cea.is_primary,
    c.first_name,
    c.last_name,
    c.email as client_primary_email
FROM client_email_aliases cea
JOIN clients c ON cea.client_id = c.id
WHERE c.first_name = 'Jess' 
    AND c.last_name = 'Horler';

