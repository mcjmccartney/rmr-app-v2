-- Simple Behavioural Briefs Update Script
-- Fixed version without SQL errors

-- Step 1: Add client_id column if it doesn't exist
ALTER TABLE behavioural_briefs 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- Step 2: Show current state BEFORE updates
SELECT 'BEFORE UPDATE - Current State' as status;

SELECT 
    COUNT(*) as total_behavioural_briefs,
    COUNT(client_id) as already_paired,
    COUNT(*) - COUNT(client_id) as need_pairing
FROM behavioural_briefs;

-- Step 3: Show which emails can be matched
SELECT 'Emails that can be paired:' as info;

SELECT 
    bb.email,
    c.first_name || ' ' || c.last_name as client_name,
    c.dog_name
FROM behavioural_briefs bb
INNER JOIN clients c ON LOWER(TRIM(bb.email)) = LOWER(TRIM(c.email))
WHERE bb.client_id IS NULL
ORDER BY bb.email;

-- Step 4: Show contact numbers that will be updated
SELECT 'Contact numbers that will get preceding 0:' as info;

SELECT 
    email,
    contact_number as current_number,
    '0' || contact_number as new_number
FROM behavioural_briefs 
WHERE LENGTH(REGEXP_REPLACE(contact_number, '[^0-9]', '', 'g')) = 10
AND contact_number NOT LIKE '0%'
AND contact_number IS NOT NULL;

-- Step 5: Update client_id by matching email addresses
UPDATE behavioural_briefs 
SET client_id = clients.id
FROM clients 
WHERE LOWER(TRIM(behavioural_briefs.email)) = LOWER(TRIM(clients.email))
AND behavioural_briefs.client_id IS NULL;

-- Step 6: Update contact numbers - add preceding 0 if only 10 digits
UPDATE behavioural_briefs 
SET contact_number = '0' || contact_number
WHERE LENGTH(REGEXP_REPLACE(contact_number, '[^0-9]', '', 'g')) = 10
AND contact_number NOT LIKE '0%'
AND contact_number IS NOT NULL;

-- Step 7: Show results AFTER updates
SELECT 'AFTER UPDATE - Results' as status;

SELECT 
    COUNT(*) as total_behavioural_briefs,
    COUNT(client_id) as successfully_paired,
    COUNT(*) - COUNT(client_id) as still_unpaired,
    ROUND((COUNT(client_id)::decimal / COUNT(*)) * 100, 1) as pairing_percentage
FROM behavioural_briefs;

-- Step 8: Show successfully paired briefs
SELECT 'Successfully paired behavioural briefs:' as info;

SELECT 
    bb.email,
    bb.contact_number,
    c.first_name || ' ' || c.last_name as client_name,
    c.dog_name,
    bb.created_at::date as brief_date
FROM behavioural_briefs bb
JOIN clients c ON bb.client_id = c.id
ORDER BY bb.created_at DESC;

-- Step 9: Show briefs that couldn't be paired
SELECT 'Behavioural briefs that could not be paired:' as info;

SELECT 
    bb.email,
    bb.contact_number,
    bb.created_at::date as brief_date
FROM behavioural_briefs bb
WHERE bb.client_id IS NULL
ORDER BY bb.created_at DESC;

-- Step 10: Show contact numbers that were updated
SELECT 'Contact numbers that were updated:' as info;

SELECT 
    email,
    contact_number,
    'Added preceding 0' as change_made
FROM behavioural_briefs 
WHERE contact_number LIKE '0%' 
AND LENGTH(REGEXP_REPLACE(contact_number, '[^0-9]', '', 'g')) = 11
ORDER BY email;
