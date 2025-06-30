-- Add questionnaire_bypass column to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS questionnaire_bypass BOOLEAN DEFAULT false;

-- Add session_plan_sent column to sessions table (if it doesn't exist)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_plan_sent BOOLEAN DEFAULT false;

-- Update the column comments
COMMENT ON COLUMN sessions.questionnaire_bypass IS 'Whether the questionnaire requirement is bypassed for this session';
COMMENT ON COLUMN sessions.session_plan_sent IS 'Whether the session plan has been sent for this session';
