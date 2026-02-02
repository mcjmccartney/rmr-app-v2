-- Sync All Behaviour Questionnaire Client Links
-- This script ensures ALL questionnaires are properly linked to their client records
-- Uses case-insensitive email matching to handle email capitalization changes

-- Step 1: Show current state
SELECT 
    'BEFORE SYNC' as status,
    COUNT(*) as total_questionnaires,
    COUNT(client_id) as already_linked,
    COUNT(*) - COUNT(client_id) as need_linking
FROM behaviour_questionnaires;

-- Step 2: Show questionnaires that need linking
SELECT 
    'QUESTIONNAIRES NEEDING LINK' as status,
    bq.id as questionnaire_id,
    bq.owner_first_name,
    bq.owner_last_name,
    bq.email as questionnaire_email,
    bq.dog_name,
    c.id as matching_client_id,
    c.first_name,
    c.last_name,
    c.email as client_email
FROM behaviour_questionnaires bq
LEFT JOIN clients c ON LOWER(TRIM(bq.email)) = LOWER(TRIM(c.email))
WHERE bq.client_id IS NULL
    OR bq.client_id != c.id;

-- Step 3: Update questionnaires to link to correct client_id
-- Match by email (case-insensitive)
UPDATE behaviour_questionnaires 
SET client_id = clients.id
FROM clients
WHERE LOWER(TRIM(behaviour_questionnaires.email)) = LOWER(TRIM(clients.email))
    AND (behaviour_questionnaires.client_id IS NULL 
         OR behaviour_questionnaires.client_id != clients.id);

-- Step 4: Show results after sync
SELECT 
    'AFTER SYNC' as status,
    COUNT(*) as total_questionnaires,
    COUNT(client_id) as linked,
    COUNT(*) - COUNT(client_id) as unlinked
FROM behaviour_questionnaires;

-- Step 5: Show any remaining unlinked questionnaires
SELECT 
    'REMAINING UNLINKED' as status,
    bq.id,
    bq.owner_first_name,
    bq.owner_last_name,
    bq.email,
    bq.dog_name,
    bq.submitted_at
FROM behaviour_questionnaires bq
WHERE bq.client_id IS NULL
ORDER BY bq.submitted_at DESC;

-- Step 6: Verify specific clients (like Jess Horler)
SELECT 
    'VERIFICATION' as status,
    c.first_name,
    c.last_name,
    c.email as client_email,
    c.dog_name as client_dog,
    bq.id as questionnaire_id,
    bq.email as questionnaire_email,
    bq.dog_name as questionnaire_dog,
    CASE 
        WHEN bq.client_id = c.id THEN '✅ LINKED'
        WHEN bq.client_id IS NULL THEN '❌ NO LINK'
        ELSE '⚠️ WRONG LINK'
    END as link_status
FROM clients c
LEFT JOIN behaviour_questionnaires bq ON bq.client_id = c.id
WHERE c.active = true
ORDER BY c.last_name, c.first_name;

