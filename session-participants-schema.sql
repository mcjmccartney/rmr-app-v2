-- Session Participants table schema for Group and RMR Live sessions
-- Run this in your Supabase SQL Editor to create the session_participants table

-- Create session_participants table
CREATE TABLE IF NOT EXISTS session_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    individual_quote DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure a client can only be added once per session
    UNIQUE(session_id, client_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_client_id ON session_participants(client_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_paid ON session_participants(paid);
CREATE INDEX IF NOT EXISTS idx_session_participants_created_at ON session_participants(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_session_participants_updated_at BEFORE UPDATE ON session_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on session_participants" ON session_participants
    FOR ALL USING (true);

-- Add comment to table
COMMENT ON TABLE session_participants IS 'Stores individual participants for Group and RMR Live sessions with their payment status';
COMMENT ON COLUMN session_participants.individual_quote IS 'Amount each participant pays for the session';
COMMENT ON COLUMN session_participants.paid IS 'Whether this specific participant has paid';
COMMENT ON COLUMN session_participants.paid_at IS 'When this participant made their payment';
