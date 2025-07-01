-- Update partner_names field from JSONB array to single TEXT field
-- Run this in your Supabase SQL Editor

-- First, create a backup of existing data
CREATE TABLE IF NOT EXISTS partner_names_backup AS 
SELECT id, partner_names FROM clients WHERE partner_names IS NOT NULL AND partner_names != '[]'::jsonb;

-- Drop the existing column and recreate as TEXT
ALTER TABLE clients DROP COLUMN IF EXISTS partner_names;
ALTER TABLE clients ADD COLUMN partner_name TEXT;

-- Drop the old index
DROP INDEX IF EXISTS idx_clients_partner_names;

-- Add comment to explain the new structure
COMMENT ON COLUMN clients.partner_name IS 'Single partner name field (TEXT)';

-- Verify the new structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'clients' 
  AND table_schema = 'public'
  AND column_name = 'partner_name'
ORDER BY ordinal_position;

-- Show backup data (if any existed)
SELECT 'Backup created with ' || COUNT(*) || ' records' as backup_status
FROM partner_names_backup;
