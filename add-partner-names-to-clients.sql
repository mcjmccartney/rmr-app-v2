-- Add partner name fields to clients table
-- Run this in your Supabase SQL Editor to add partner name functionality

-- Add partner name fields to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS partner_names JSONB DEFAULT '[]'::jsonb;

-- Create index for better performance when querying partner names
CREATE INDEX IF NOT EXISTS idx_clients_partner_names ON clients USING GIN (partner_names);

-- Add comment to explain the structure
COMMENT ON COLUMN clients.partner_names IS 'Array of partner objects with firstName and lastName fields, e.g. [{"firstName": "John", "lastName": "Doe"}, {"firstName": "Jane", "lastName": "Smith"}]';

-- Verify the new structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
  AND table_schema = 'public'
  AND column_name = 'partner_names'
ORDER BY ordinal_position;
