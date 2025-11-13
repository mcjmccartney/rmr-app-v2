-- Migration to add has_main_goals column to session_plans table
-- This tracks whether the "Main Goals & Exp. of Behaviour" section is included (not removed)

-- Add the has_main_goals column if it doesn't exist
ALTER TABLE session_plans ADD COLUMN IF NOT EXISTS has_main_goals BOOLEAN DEFAULT true;

-- Set default value for existing records (assume they all have main goals section)
UPDATE session_plans SET has_main_goals = true WHERE has_main_goals IS NULL;

-- Add a comment to document the field
COMMENT ON COLUMN session_plans.has_main_goals IS 'Whether the main goals and explanation of behaviour section is included in the session plan (false if Remove button was clicked)';

