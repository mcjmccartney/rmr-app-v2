-- Update Behavioural Briefs: Pair with Clients and Format Contact Numbers
-- Run this in your Supabase SQL Editor

-- Step 1: Add client_id column if it doesn't exist
ALTER TABLE behavioural_briefs 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- Step 2: Update client_id by matching email addresses
UPDATE behavioural_briefs 
SET client_id = clients.id
FROM clients 
WHERE behavioural_briefs.email = clients.email 
AND behavioural_briefs.client_id IS NULL;

-- Step 3: Format contact numbers - add preceding 0 if only 10 digits
UPDATE behavioural_briefs 
SET contact_number = '0' || contact_number
WHERE LENGTH(REGEXP_REPLACE(contact_number, '[^0-9]', '', 'g')) = 10
AND contact_number NOT LIKE '0%'
AND contact_number IS NOT NULL;

-- Step 4: Show results of the pairing
SELECT 
    bb.id,
    bb.email,
    bb.contact_number,
    bb.client_id,
    c.first_name,
    c.last_name,
    c.dog_name,
    CASE 
        WHEN bb.client_id IS NOT NULL THEN 'Paired'
        ELSE 'Not Paired'
    END as pairing_status
FROM behavioural_briefs bb
LEFT JOIN clients c ON bb.client_id = c.id
ORDER BY bb.created_at DESC;

-- Step 5: Show summary statistics
SELECT 
    COUNT(*) as total_behavioural_briefs,
    COUNT(client_id) as paired_briefs,
    COUNT(*) - COUNT(client_id) as unpaired_briefs,
    ROUND((COUNT(client_id)::decimal / COUNT(*)) * 100, 2) as pairing_percentage
FROM behavioural_briefs;

-- Step 6: Show unpaired behavioural briefs (emails not found in clients)
SELECT 
    bb.id,
    bb.email,
    bb.contact_number,
    bb.created_at,
    'Email not found in clients table' as reason
FROM behavioural_briefs bb
WHERE bb.client_id IS NULL
ORDER BY bb.created_at DESC;

-- Step 7: Show contact numbers that were updated
SELECT 
    id,
    email,
    contact_number,
    'Contact number formatted' as update_type
FROM behavioural_briefs 
WHERE contact_number LIKE '0%' 
AND LENGTH(REGEXP_REPLACE(contact_number, '[^0-9]', '', 'g')) = 11
ORDER BY created_at DESC;
