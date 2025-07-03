-- Supabase Schema for Raising My Rescue App
-- Run these commands in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    dog_name VARCHAR(255), -- Made optional - some clients might not have a dog yet
    other_dogs TEXT[], -- Array of strings for multiple dogs
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    active BOOLEAN DEFAULT true,
    membership BOOLEAN DEFAULT false,
    avatar VARCHAR(10), -- For storing initials like 'RMR'
    behavioural_brief_id UUID,
    behaviour_questionnaire_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('In-Person', 'Online', 'Training - 1hr', 'Training - 30mins', 'Online Catchup', 'Group', 'Phone Call', 'Coaching')),
    booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    quote DECIMAL(10,2) NOT NULL,
    session_paid BOOLEAN DEFAULT false,
    payment_confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(active);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_booking_date ON sessions(booking_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
-- For now, allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on clients" ON clients
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on sessions" ON sessions
    FOR ALL USING (true);

-- Insert sample data (optional - you can remove this if you want to start fresh)
INSERT INTO clients (id, first_name, last_name, dog_name, phone, email, address, active, membership) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Sarah', 'Cook', 'Larry', '07123456789', 'sarah.cook@email.com', '123 Main Street, London, SW1A 1AA', true, true),
('550e8400-e29b-41d4-a716-446655440002', 'Test', 'User', 'Buddy', '07987654321', 'test.user@email.com', null, true, false),
('550e8400-e29b-41d4-a716-446655440003', 'Grace', 'Bryant', 'Ruby', '07555123456', 'grace.bryant@email.com', '456 Oak Avenue, Manchester, M1 1AA', true, true),
('550e8400-e29b-41d4-a716-446655440004', 'Julie', 'Moore', 'Mila', '07444987654', 'julie.moore@email.com', null, true, false),
('550e8400-e29b-41d4-a716-446655440005', 'Amelia', 'Wright', 'Milo', '07333456789', 'amelia.wright@email.com', '789 Pine Road, Birmingham, B1 1AA', true, true),
('550e8400-e29b-41d4-a716-446655440006', 'Claire', 'Woolston', null, '07222333444', 'claire.woolston@email.com', null, true, false);

INSERT INTO sessions (client_id, session_type, booking_date, quote, notes) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'In-Person', '2025-07-30T09:30:00Z', 75.00, 'Great progress with recall training'),
('550e8400-e29b-41d4-a716-446655440002', 'In-Person', '2025-07-25T12:00:00Z', 85.00, null),
('550e8400-e29b-41d4-a716-446655440003', 'In-Person', '2025-07-25T09:15:00Z', 75.00, null),
('550e8400-e29b-41d4-a716-446655440004', 'In-Person', '2025-07-23T10:00:00Z', 80.00, null),
('550e8400-e29b-41d4-a716-446655440005', 'Training', '2025-07-18T09:00:00Z', 85.00, null);
