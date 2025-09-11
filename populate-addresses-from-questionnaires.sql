-- populate-addresses-from-questionnaires.sql
-- One-time migration to populate blank client addresses from behaviour questionnaires
-- Uses the first questionnaire (oldest submitted_at) for each client

-- Show current state before update
SELECT 
    'BEFORE UPDATE - Current State' as status,
    COUNT(*) as total_clients,
    COUNT(CASE WHEN address IS NULL OR address = '' THEN 1 END) as clients_with_blank_address,
    COUNT(CASE WHEN address IS NOT NULL AND address != '' THEN 1 END) as clients_with_address
FROM clients;

-- Show how many clients can be updated
SELECT 
    'POTENTIAL UPDATES' as status,
    COUNT(DISTINCT c.id) as clients_that_can_be_updated
FROM clients c
JOIN behaviour_questionnaires bq ON bq.client_id = c.id
WHERE (c.address IS NULL OR c.address = '')
AND bq.address1 IS NOT NULL AND bq.address1 != '';

-- Update clients with blank addresses using their first questionnaire
UPDATE clients 
SET 
    address = (
        SELECT CONCAT(
            bq.address1,
            CASE WHEN bq.address2 IS NOT NULL AND bq.address2 != '' 
                 THEN CONCAT(', ', bq.address2) 
                 ELSE '' END,
            ', ', bq.city,
            ', ', bq.state_province,
            ' ', bq.zip_postal_code,
            ', ', bq.country
        )
        FROM behaviour_questionnaires bq 
        WHERE bq.client_id = clients.id
        AND bq.address1 IS NOT NULL AND bq.address1 != ''
        ORDER BY bq.submitted_at ASC  -- Use first questionnaire (oldest)
        LIMIT 1
    ),
    updated_at = NOW()
WHERE (clients.address IS NULL OR clients.address = '')
AND EXISTS (
    SELECT 1 FROM behaviour_questionnaires bq 
    WHERE bq.client_id = clients.id 
    AND bq.address1 IS NOT NULL AND bq.address1 != ''
);

-- Show results after update
SELECT 
    'AFTER UPDATE - Results' as status,
    COUNT(*) as total_clients,
    COUNT(CASE WHEN address IS NULL OR address = '' THEN 1 END) as clients_with_blank_address,
    COUNT(CASE WHEN address IS NOT NULL AND address != '' THEN 1 END) as clients_with_address
FROM clients;

-- Show sample of updated addresses
SELECT 
    'SAMPLE UPDATED ADDRESSES' as sample_header,
    c.first_name || ' ' || c.last_name as client_name,
    c.email,
    c.address as populated_address
FROM clients c
WHERE c.address IS NOT NULL 
AND c.address != ''
AND c.updated_at > NOW() - INTERVAL '1 minute'  -- Recently updated
LIMIT 10;
