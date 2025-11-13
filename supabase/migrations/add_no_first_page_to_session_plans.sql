-- Add no_first_page column to session_plans table
-- This field tracks whether the user has clicked "Remove" on the Main Goals & Exp. of Behaviour section
-- When true, the first page of the PDF preview will be hidden

ALTER TABLE session_plans 
ADD COLUMN IF NOT EXISTS no_first_page BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN session_plans.no_first_page IS 'When true, hides the first page (Main Goals & Explanation) in PDF preview';

