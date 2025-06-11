-- Add document_edit_url column to session_plans table
-- This will store the Google Doc edit URL returned by Make.com

ALTER TABLE session_plans 
ADD COLUMN document_edit_url TEXT;

-- Add an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_session_plans_document_url 
ON session_plans(document_edit_url) 
WHERE document_edit_url IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'session_plans' 
AND column_name = 'document_edit_url';
