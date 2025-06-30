-- Group Coaching Resets Schema for Supabase
-- Run this in your Supabase SQL Editor to create the group_coaching_resets table

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create group_coaching_resets table
CREATE TABLE IF NOT EXISTS group_coaching_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    reset_date DATE NOT NULL, -- Date when the reset was applied (YYYY-MM-DD)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_coaching_resets_client_id ON group_coaching_resets(client_id);
CREATE INDEX IF NOT EXISTS idx_group_coaching_resets_reset_date ON group_coaching_resets(reset_date);
CREATE INDEX IF NOT EXISTS idx_group_coaching_resets_created_at ON group_coaching_resets(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_group_coaching_resets_updated_at BEFORE UPDATE ON group_coaching_resets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE group_coaching_resets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on group_coaching_resets" ON group_coaching_resets
    FOR ALL USING (true);

-- Add comments for documentation
COMMENT ON TABLE group_coaching_resets IS 'Stores group coaching reset dates for membership tracking';
COMMENT ON COLUMN group_coaching_resets.client_id IS 'Reference to the client whose membership count was reset';
COMMENT ON COLUMN group_coaching_resets.reset_date IS 'Date when the group coaching count was reset to 0';

-- Verify the table was created successfully
SELECT 'Group coaching resets table created successfully!' as status;
