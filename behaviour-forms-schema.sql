-- Behaviour Forms Schema for Supabase
-- Run this in your Supabase SQL Editor to create the behaviour questionnaires and behavioural briefs tables

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create behavioural_briefs table
CREATE TABLE IF NOT EXISTS behavioural_briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Contact Information
    owner_first_name VARCHAR(255) NOT NULL,
    owner_last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    postcode VARCHAR(20) NOT NULL,
    
    -- Dog Information
    dog_name VARCHAR(255) NOT NULL,
    sex VARCHAR(10) NOT NULL CHECK (sex IN ('Male', 'Female')),
    breed VARCHAR(255) NOT NULL,
    life_with_dog TEXT NOT NULL,
    best_outcome TEXT NOT NULL,
    session_type VARCHAR(100) NOT NULL CHECK (session_type IN ('Online Session', 'In-Person Session', 'Rescue Remedy Session (Dog Club members & current clients only)')),
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create behaviour_questionnaires table
CREATE TABLE IF NOT EXISTS behaviour_questionnaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Owner Information
    owner_first_name VARCHAR(255) NOT NULL,
    owner_last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    address1 VARCHAR(255) NOT NULL,
    address2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100) NOT NULL,
    zip_postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    how_did_you_hear TEXT,
    
    -- Dog Information
    dog_name VARCHAR(255) NOT NULL,
    age VARCHAR(50) NOT NULL,
    sex VARCHAR(10) NOT NULL CHECK (sex IN ('Male', 'Female')),
    breed VARCHAR(255) NOT NULL,
    neutered_spayed VARCHAR(255) NOT NULL,
    main_help TEXT,
    first_noticed TEXT,
    when_where_how TEXT,
    recent_change TEXT,
    can_anticipate TEXT,
    why_thinking TEXT,
    what_done_so_far TEXT,
    ideal_goal TEXT,
    anything_else TEXT,
    
    -- Health and Veterinary
    medical_history TEXT,
    vet_advice TEXT,
    
    -- Background
    where_got_dog TEXT,
    rescue_background TEXT,
    age_when_got VARCHAR(100),
    
    -- Diet and Feeding
    what_feed TEXT,
    food_motivated INTEGER DEFAULT 5 CHECK (food_motivated >= 1 AND food_motivated <= 10),
    mealtime TEXT,
    treat_routine TEXT,
    happy_with_treats TEXT,
    
    -- Routines
    types_of_play TEXT,
    affectionate TEXT,
    exercise TEXT,
    use_muzzle TEXT,
    familiar_people TEXT,
    unfamiliar_people TEXT,
    housetrained TEXT,
    likes_to_do TEXT,
    
    -- Temperament
    like_about_dog TEXT,
    most_challenging TEXT,
    
    -- Training
    how_good TEXT,
    favourite_rewards TEXT,
    how_bad TEXT,
    effect_of_bad TEXT,
    professional_training TEXT,
    
    -- Sociability
    sociability_dogs VARCHAR(50) CHECK (sociability_dogs IN ('Sociable', 'Nervous', 'Reactive', 'Disinterested')),
    sociability_people VARCHAR(50) CHECK (sociability_people IN ('Sociable', 'Nervous', 'Reactive', 'Disinterested')),
    anything_else_to_know TEXT,
    time_per_week TEXT,
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_behavioural_briefs_email ON behavioural_briefs(email);
CREATE INDEX IF NOT EXISTS idx_behavioural_briefs_client_id ON behavioural_briefs(client_id);
CREATE INDEX IF NOT EXISTS idx_behavioural_briefs_submitted_at ON behavioural_briefs(submitted_at);

CREATE INDEX IF NOT EXISTS idx_behaviour_questionnaires_email ON behaviour_questionnaires(email);
CREATE INDEX IF NOT EXISTS idx_behaviour_questionnaires_client_id ON behaviour_questionnaires(client_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_questionnaires_submitted_at ON behaviour_questionnaires(submitted_at);
CREATE INDEX IF NOT EXISTS idx_behaviour_questionnaires_email_dog ON behaviour_questionnaires(email, dog_name);

-- Create updated_at trigger function (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_behavioural_briefs_updated_at BEFORE UPDATE ON behavioural_briefs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_behaviour_questionnaires_updated_at BEFORE UPDATE ON behaviour_questionnaires
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE behavioural_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE behaviour_questionnaires ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - you can restrict later)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'behavioural_briefs'
        AND policyname = 'Allow all operations on behavioural_briefs'
    ) THEN
        CREATE POLICY "Allow all operations on behavioural_briefs" ON behavioural_briefs
            FOR ALL USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'behaviour_questionnaires'
        AND policyname = 'Allow all operations on behaviour_questionnaires'
    ) THEN
        CREATE POLICY "Allow all operations on behaviour_questionnaires" ON behaviour_questionnaires
            FOR ALL USING (true);
    END IF;
END $$;

-- Add booking_terms_signed fields to clients table (if not already exists)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS booking_terms_signed BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS booking_terms_signed_date TIMESTAMP WITH TIME ZONE;

-- Remove email column from sessions table if it exists (this was causing the constraint error)
-- First check if the column exists and has data
DO $$
BEGIN
    -- Check if email column exists in sessions table
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        AND column_name = 'email' 
        AND table_schema = 'public'
    ) THEN
        -- If it exists, drop it (it shouldn't be there based on your schema)
        ALTER TABLE sessions DROP COLUMN email;
        RAISE NOTICE 'Removed email column from sessions table';
    END IF;
END $$;

-- Verify the final structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('behavioural_briefs', 'behaviour_questionnaires', 'clients', 'sessions')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
