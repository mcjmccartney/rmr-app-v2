-- Fix Jess Horler's Session Dog Names
-- This script updates all sessions from "Tinker" to "Tinka" to match the updated client record

-- Step 1: Check current state
SELECT 
    'CURRENT STATE - SESSIONS' as status,
    s.id as session_id,
    s.booking_date,
    s.dog_name as session_dog_name,
    c.dog_name as client_dog_name,
    CASE 
        WHEN LOWER(TRIM(s.dog_name)) = LOWER(TRIM(c.dog_name)) THEN '✅ MATCH'
        ELSE '❌ MISMATCH'
    END as match_status
FROM sessions s
JOIN clients c ON s.client_id = c.id
WHERE c.first_name = 'Jess' 
    AND c.last_name = 'Horler'
ORDER BY s.booking_date DESC;

-- Step 2: Check questionnaire dog name
SELECT 
    'QUESTIONNAIRE DOG NAME' as status,
    bq.id as questionnaire_id,
    bq.dog_name as questionnaire_dog_name,
    c.dog_name as client_dog_name
FROM behaviour_questionnaires bq
JOIN clients c ON bq.client_id = c.id
WHERE c.first_name = 'Jess' 
    AND c.last_name = 'Horler';

-- Step 3: Update all sessions from "Tinker" to "Tinka"
UPDATE sessions 
SET 
    dog_name = 'Tinka',
    updated_at = NOW()
WHERE client_id = (
    SELECT id 
    FROM clients 
    WHERE first_name = 'Jess' 
        AND last_name = 'Horler'
    LIMIT 1
)
AND LOWER(TRIM(dog_name)) = 'tinker';

-- Step 4: Verify the fix
SELECT 
    'AFTER FIX - SESSIONS' as status,
    s.id as session_id,
    s.booking_date,
    s.dog_name as session_dog_name,
    c.dog_name as client_dog_name,
    CASE 
        WHEN LOWER(TRIM(s.dog_name)) = LOWER(TRIM(c.dog_name)) THEN '✅ MATCH'
        ELSE '❌ MISMATCH'
    END as match_status
FROM sessions s
JOIN clients c ON s.client_id = c.id
WHERE c.first_name = 'Jess' 
    AND c.last_name = 'Horler'
ORDER BY s.booking_date DESC;

-- Step 5: Check if questionnaire now matches
SELECT 
    'QUESTIONNAIRE MATCHING' as status,
    s.id as session_id,
    s.booking_date,
    s.dog_name as session_dog_name,
    bq.id as questionnaire_id,
    bq.dog_name as questionnaire_dog_name,
    CASE 
        WHEN LOWER(TRIM(s.dog_name)) = LOWER(TRIM(bq.dog_name)) THEN '✅ WILL MATCH'
        ELSE '❌ WILL NOT MATCH'
    END as match_status
FROM sessions s
JOIN clients c ON s.client_id = c.id
LEFT JOIN behaviour_questionnaires bq ON bq.client_id = c.id 
    AND LOWER(TRIM(bq.dog_name)) = LOWER(TRIM(s.dog_name))
WHERE c.first_name = 'Jess' 
    AND c.last_name = 'Horler'
ORDER BY s.booking_date DESC;

