-- Rename state_province column to county in behaviour_questionnaires table
-- This script safely renames the column while preserving all data

-- Step 1: Check current column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'behaviour_questionnaires' 
        AND column_name = 'state_province'
        AND table_schema = 'public'
    ) THEN
        -- Step 2: Rename the column
        ALTER TABLE behaviour_questionnaires 
        RENAME COLUMN state_province TO county;
        
        RAISE NOTICE 'Successfully renamed state_province column to county';
    ELSE
        RAISE NOTICE 'Column state_province does not exist or has already been renamed';
    END IF;
END $$;

-- Step 3: Verify the change
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'behaviour_questionnaires' 
    AND column_name IN ('county', 'state_province')
    AND table_schema = 'public'
ORDER BY column_name;

-- Step 4: Show sample data to confirm
SELECT 
    id,
    owner_first_name,
    owner_last_name,
    city,
    county,
    country
FROM behaviour_questionnaires 
LIMIT 5;
