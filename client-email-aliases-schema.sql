-- Client Email Aliases Schema for Supabase
-- Run this in your Supabase SQL Editor to create the client_email_aliases table

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create client_email_aliases table
CREATE TABLE IF NOT EXISTS client_email_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_email_aliases_client_id ON client_email_aliases(client_id);
CREATE INDEX IF NOT EXISTS idx_client_email_aliases_email ON client_email_aliases(email);
CREATE INDEX IF NOT EXISTS idx_client_email_aliases_is_primary ON client_email_aliases(is_primary);

-- Create unique constraint to prevent duplicate email aliases for the same client
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_email_aliases_unique 
ON client_email_aliases(client_id, email);

-- Create unique constraint to ensure only one primary email per client
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_email_aliases_primary_unique 
ON client_email_aliases(client_id) 
WHERE is_primary = true;

-- Create trigger function for updated_at (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_client_email_aliases_updated_at 
BEFORE UPDATE ON client_email_aliases
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE client_email_aliases ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on client_email_aliases" ON client_email_aliases
    FOR ALL USING (true);

-- Verify the table was created successfully
SELECT 'Client email aliases table created successfully!' as status;
