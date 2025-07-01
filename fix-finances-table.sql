-- Fix the finances table by adding the missing updated_at column
-- Run this in your Supabase SQL Editor

-- Add the missing updated_at column
ALTER TABLE finances 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;

-- Update existing records to have the updated_at value
UPDATE finances 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Verify the fix worked
SELECT 'Finances table updated_at column added successfully!' as status;
