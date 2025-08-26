-- Migration to add edited_action_points field to existing session_plans table
-- Run this if you already have the session_plans table created

-- Add the edited_action_points column if it doesn't exist
ALTER TABLE session_plans ADD COLUMN IF NOT EXISTS edited_action_points JSONB;

-- Add a comment to document the field
COMMENT ON COLUMN session_plans.edited_action_points IS 'Stores custom edited action point content as JSON object with action point IDs as keys';
