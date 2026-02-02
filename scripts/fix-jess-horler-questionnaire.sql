-- Fix Jess Horler's Questionnaire Linking
-- This script ensures her questionnaire is properly linked to her client record
-- after the email change from Horlerjess@gmail.com to horlerjess@gmail.com

-- Step 1: Check current state
SELECT 
    'CURRENT STATE' as status,
    c.id as client_id,
    c.first_name,
    c.last_name,
    c.email as client_email,
    c.dog_name as client_dog,
    bq.id as questionnaire_id,
    bq.email as questionnaire_email,
    bq.dog_name as questionnaire_dog,
    bq.client_id as questionnaire_client_id
FROM clients c
LEFT JOIN behaviour_questionnaires bq 
    ON LOWER(TRIM(bq.email)) = LOWER(TRIM(c.email))
    OR bq.client_id = c.id
WHERE c.first_name = 'Jess' 
    AND c.last_name = 'Horler';

-- Step 2: Update questionnaire to link to correct client_id
-- This will match by email (case-insensitive) and set the client_id
UPDATE behaviour_questionnaires 
SET client_id = (
    SELECT c.id 
    FROM clients c 
    WHERE c.first_name = 'Jess' 
        AND c.last_name = 'Horler'
        AND LOWER(TRIM(c.email)) = 'horlerjess@gmail.com'
    LIMIT 1
)
WHERE LOWER(TRIM(email)) IN ('horlerjess@gmail.com', 'horlerjess@gmail.com')
    AND (client_id IS NULL OR client_id != (
        SELECT c.id 
        FROM clients c 
        WHERE c.first_name = 'Jess' 
            AND c.last_name = 'Horler'
            AND LOWER(TRIM(c.email)) = 'horlerjess@gmail.com'
        LIMIT 1
    ));

-- Step 3: Verify the fix
SELECT 
    'AFTER FIX' as status,
    c.id as client_id,
    c.first_name,
    c.last_name,
    c.email as client_email,
    c.dog_name as client_dog,
    bq.id as questionnaire_id,
    bq.email as questionnaire_email,
    bq.dog_name as questionnaire_dog,
    bq.client_id as questionnaire_client_id,
    CASE 
        WHEN bq.client_id = c.id THEN '✅ LINKED'
        ELSE '❌ NOT LINKED'
    END as link_status
FROM clients c
LEFT JOIN behaviour_questionnaires bq 
    ON bq.client_id = c.id
WHERE c.first_name = 'Jess' 
    AND c.last_name = 'Horler';

