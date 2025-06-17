-- Simple Behaviour Questionnaires Update Script
-- Fixed version without SQL errors
-- Use proper SQL comment syntax (-- for single line comments)

-- Step 1: Add client_id column if it doesn't exist
ALTER TABLE behaviour_questionnaires 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- Step 2: Show current state BEFORE updates
SELECT 'BEFORE UPDATE - Current State' as status;

SELECT 
    COUNT(*) as total_behaviour_questionnaires,
    COUNT(client_id) as already_paired,
    COUNT(*) - COUNT(client_id) as need_pairing
FROM behaviour_questionnaires;

-- Step 3: Update behaviour_questionnaires with client_id where emails match
UPDATE behaviour_questionnaires 
SET client_id = clients.id
FROM clients
WHERE behaviour_questionnaires.client_id IS NULL
AND LOWER(TRIM(behaviour_questionnaires.email)) = LOWER(TRIM(clients.email));

-- Step 4: Format contact numbers - add preceding 0 to 10-digit numbers
UPDATE behaviour_questionnaires
SET contact_number = '0' || contact_number
WHERE LENGTH(contact_number) = 10 
AND contact_number ~ '^[0-9]+$'
AND LEFT(contact_number, 1) != '0';

-- Step 5: Show current state AFTER updates
SELECT 'AFTER UPDATE - Current State' as status;

SELECT 
    COUNT(*) as total_behaviour_questionnaires,
    COUNT(client_id) as paired_with_clients,
    COUNT(*) - COUNT(client_id) as still_unpaired
FROM behaviour_questionnaires;

-- Step 6: Show contact number formatting results
SELECT 
    'Contact Numbers After Formatting' as status,
    COUNT(CASE WHEN LENGTH(contact_number) = 11 AND LEFT(contact_number, 1) = '0' THEN 1 END) as formatted_contacts,
    COUNT(CASE WHEN LENGTH(contact_number) = 10 THEN 1 END) as still_need_formatting
FROM behaviour_questionnaires;

-- Step 7: Show unpaired questionnaires for review
SELECT 
    'Unpaired Questionnaires' as status,
    owner_first_name,
    owner_last_name,
    email,
    dog_name
FROM behaviour_questionnaires
WHERE client_id IS NULL
ORDER BY owner_last_name, owner_first_name;

-- Step 8: Show sample of paired questionnaires
SELECT 
    'Sample Paired Questionnaires' as status,
    bq.owner_first_name || ' ' || bq.owner_last_name as questionnaire_owner,
    bq.email as questionnaire_email,
    c.first_name || ' ' || c.last_name as client_name,
    c.email as client_email
FROM behaviour_questionnaires bq
JOIN clients c ON bq.client_id = c.id
LIMIT 5;
