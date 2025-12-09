-- Migration: Add audit trail system
-- Run this against your Supabase/Postgres database
-- This creates a comprehensive audit log for tracking all important operations

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What happened
  action_type varchar(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT', etc.
  entity_type varchar(50) NOT NULL, -- 'SESSION', 'CLIENT', 'BOOKING_TERMS', 'SESSION_PLAN', etc.
  entity_id uuid, -- ID of the affected entity (can be null for some actions)
  
  -- Who did it
  user_email varchar(255), -- Email of the user who performed the action
  user_id uuid, -- User ID if available
  
  -- When it happened
  timestamp timestamptz DEFAULT now() NOT NULL,
  
  -- Details about what changed
  old_values jsonb, -- Previous state of the entity (for UPDATE and DELETE)
  new_values jsonb, -- New state of the entity (for CREATE and UPDATE)
  
  -- Additional context
  description text, -- Human-readable description of the action
  metadata jsonb, -- Additional metadata (IP address, user agent, etc.)
  
  -- Indexes for common queries
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_combined ON audit_logs(entity_type, entity_id, timestamp DESC);

-- Add comment to explain the table
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for tracking all important operations in the application';
COMMENT ON COLUMN audit_logs.action_type IS 'Type of action performed (CREATE, UPDATE, DELETE, etc.)';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity affected (SESSION, CLIENT, etc.)';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID of the affected entity';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous state of the entity (JSON)';
COMMENT ON COLUMN audit_logs.new_values IS 'New state of the entity (JSON)';
COMMENT ON COLUMN audit_logs.description IS 'Human-readable description of the action';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context like IP address, user agent, etc.';

-- Enable Row Level Security (RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read audit logs
CREATE POLICY "Allow authenticated users to read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow service role to insert audit logs
CREATE POLICY "Allow service role to insert audit logs"
  ON audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Verify the table was created
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'audit_logs'
  AND table_schema = 'public'
ORDER BY ordinal_position;

