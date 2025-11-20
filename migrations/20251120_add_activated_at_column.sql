-- Migration: Add activated_at column to existing booking_terms_versions table
-- Run this in Supabase SQL Editor

-- Add activated_at column to booking_terms_versions table
ALTER TABLE booking_terms_versions ADD COLUMN IF NOT EXISTS activated_at timestamptz;

-- Add booking_terms_version column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS booking_terms_version TEXT;

-- Update the existing active version to have activated_at set to now
UPDATE booking_terms_versions 
SET activated_at = now() 
WHERE is_active = true AND activated_at IS NULL;

-- Add comments
COMMENT ON COLUMN booking_terms_versions.activated_at IS 'Timestamp when this version was set as active';
COMMENT ON COLUMN clients.booking_terms_version IS 'Stores the activated_at date of the booking terms version the client signed (e.g., "From 19/11/2025")';

