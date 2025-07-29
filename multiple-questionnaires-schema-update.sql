-- Multiple Questionnaires Schema Update
-- This script updates the database to support multiple behaviour questionnaires per client
-- Each questionnaire will be tied to a specific dog via client_id + dog_name combination

-- Step 1: Remove the single behaviour_questionnaire_id from clients table
-- This field is no longer needed since we'll support multiple questionnaires per client
ALTER TABLE clients DROP COLUMN IF EXISTS behaviour_questionnaire_id;

-- Step 2: Ensure behaviour_questionnaires table has proper structure
-- The table should already have client_id and dog_name fields from previous schema
-- Let's verify and add any missing constraints

-- Add index for efficient querying by client_id + dog_name combination
CREATE INDEX IF NOT EXISTS idx_behaviour_questionnaires_client_dog 
ON behaviour_questionnaires(client_id, dog_name);

-- Add index for efficient querying by email (for form submissions)
CREATE INDEX IF NOT EXISTS idx_behaviour_questionnaires_email 
ON behaviour_questionnaires(email);

-- Step 3: Clean up duplicate questionnaires before adding unique constraint
-- First, let's identify and remove duplicates, keeping only the most recent one for each client+dog combination

-- Create a temporary table with the IDs of questionnaires to keep (most recent per client+dog)
WITH questionnaires_to_keep AS (
  SELECT DISTINCT ON (client_id, dog_name) id
  FROM behaviour_questionnaires
  WHERE client_id IS NOT NULL AND dog_name IS NOT NULL
  ORDER BY client_id, dog_name, submitted_at DESC
)
-- Delete duplicate questionnaires (keep only the most recent one per client+dog)
DELETE FROM behaviour_questionnaires
WHERE client_id IS NOT NULL
  AND dog_name IS NOT NULL
  AND id NOT IN (SELECT id FROM questionnaires_to_keep);

-- Now add the unique constraint to prevent future duplicates
ALTER TABLE behaviour_questionnaires
DROP CONSTRAINT IF EXISTS unique_client_dog_questionnaire;

ALTER TABLE behaviour_questionnaires
ADD CONSTRAINT unique_client_dog_questionnaire
UNIQUE (client_id, dog_name);

-- Step 4: Show what duplicates were found and removed
SELECT 'Duplicate questionnaires analysis:' as info;
SELECT
  client_id,
  dog_name,
  COUNT(*) as questionnaire_count,
  STRING_AGG(id::text, ', ' ORDER BY submitted_at DESC) as questionnaire_ids,
  MAX(submitted_at) as most_recent_submission
FROM behaviour_questionnaires
WHERE client_id IS NOT NULL AND dog_name IS NOT NULL
GROUP BY client_id, dog_name
ORDER BY questionnaire_count DESC, client_id, dog_name;

-- Step 5: Verify the current structure
SELECT 'Current behaviour_questionnaires structure:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'behaviour_questionnaires' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 6: Show current clients structure (should no longer have behaviour_questionnaire_id)
SELECT 'Current clients structure:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 7: Show existing questionnaires grouped by client
SELECT 'Existing questionnaires by client:' as info;
SELECT 
  c.first_name,
  c.last_name,
  c.email,
  c.dog_name as client_primary_dog,
  c.other_dogs,
  bq.dog_name as questionnaire_dog,
  bq.submitted_at
FROM clients c
LEFT JOIN behaviour_questionnaires bq ON c.id = bq.client_id
ORDER BY c.first_name, c.last_name, bq.submitted_at;
