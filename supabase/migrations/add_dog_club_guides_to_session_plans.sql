-- Add dog_club_guides column to session_plans table
-- This field stores an array of Dog Club Guide IDs that are selected for the session plan
-- These guides will be included in the session plan email as a list of links

ALTER TABLE session_plans
ADD COLUMN IF NOT EXISTS dog_club_guides TEXT[];

-- Add comment to explain the column
COMMENT ON COLUMN session_plans.dog_club_guides IS 'Array of Dog Club Guide IDs to include in the session plan email';

