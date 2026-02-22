-- Dog Club Guides Table Migration
-- Run this in your Supabase SQL Editor to create the dog_club_guides table

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create dog_club_guides table
CREATE TABLE IF NOT EXISTS dog_club_guides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on title for faster searches
CREATE INDEX IF NOT EXISTS idx_dog_club_guides_title ON dog_club_guides(title);

-- Insert existing guides from the hardcoded data
INSERT INTO dog_club_guides (title, url) VALUES
('Member Perks', 'https://www.raisingmyrescue.co.uk/member-perks'),
('Communicating with your Dog', 'https://www.raisingmyrescue.co.uk/communicate-with-your-dog'),
('Telling Tails', 'https://www.raisingmyrescue.co.uk/communicate-with-your-dog/telling-tails'),
('Talk Dog', 'https://www.raisingmyrescue.co.uk/communicate-with-your-dog/talk-dog'),
('Read Signals of Discomfort', 'https://www.raisingmyrescue.co.uk/communicate-with-your-dog/ladder-of-aggression'),
('Dog-to-Dog Interactions', 'https://www.raisingmyrescue.co.uk/communicate-with-your-dog/dog-to-dog-interactions'),
('Build Your Bond', 'https://www.raisingmyrescue.co.uk/build-your-bond'),
('Trigger Stacking Guides', 'https://www.raisingmyrescue.co.uk/support-emotional-wellbeing'),
('Major Event Guides (scroll down)', 'https://www.raisingmyrescue.co.uk/support-emotional-wellbeing');

-- Enable Row Level Security (RLS)
ALTER TABLE dog_club_guides ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read dog club guides"
ON dog_club_guides FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow all authenticated users to insert (admin check will be in API)
CREATE POLICY "Allow authenticated users to insert dog club guides"
ON dog_club_guides FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow all authenticated users to update (admin check will be in API)
CREATE POLICY "Allow authenticated users to update dog club guides"
ON dog_club_guides FOR UPDATE
TO authenticated
USING (true);

-- Create policy to allow all authenticated users to delete (admin check will be in API)
CREATE POLICY "Allow authenticated users to delete dog club guides"
ON dog_club_guides FOR DELETE
TO authenticated
USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dog_club_guides_updated_at BEFORE UPDATE
ON dog_club_guides FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

