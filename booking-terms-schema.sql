-- Booking Terms Schema for Supabase
-- Run this in your Supabase SQL Editor to create the booking_terms table

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create booking_terms table
CREATE TABLE IF NOT EXISTS booking_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    submitted TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_booking_terms_email ON booking_terms(email);
CREATE INDEX IF NOT EXISTS idx_booking_terms_submitted ON booking_terms(submitted);

-- Enable Row Level Security (RLS)
ALTER TABLE booking_terms ENABLE ROW LEVEL SECURITY;

-- Create policy (allow all operations for now - you can restrict later)
CREATE POLICY "Allow all operations on booking_terms" ON booking_terms
    FOR ALL USING (true);

-- Verify the structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'booking_terms' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
