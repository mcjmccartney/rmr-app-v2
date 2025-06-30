-- Memberships table schema for Raising My Rescue app
-- Run this in your Supabase SQL Editor to create the memberships table

-- Create memberships table
CREATE TABLE IF NOT EXISTS memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    month VARCHAR(50) NOT NULL, -- e.g., "January 2024"
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Paid', 'Pending', 'Overdue')),
    payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_memberships_client_id ON memberships(client_id);
CREATE INDEX IF NOT EXISTS idx_memberships_email ON memberships(email);
CREATE INDEX IF NOT EXISTS idx_memberships_month ON memberships(month);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_created_at ON memberships(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on memberships" ON memberships
    FOR ALL USING (true);

-- Insert sample data (optional - remove if you want to start fresh)
INSERT INTO memberships (client_id, email, month, amount, status, payment_date) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'sarah.cook@email.com', 'January 2024', 50.00, 'Paid', '2024-01-15'),
('550e8400-e29b-41d4-a716-446655440001', 'sarah.cook@email.com', 'February 2024', 50.00, 'Paid', '2024-02-15'),
('550e8400-e29b-41d4-a716-446655440001', 'sarah.cook@email.com', 'March 2024', 50.00, 'Pending', NULL),
('550e8400-e29b-41d4-a716-446655440002', 'mike.jones@email.com', 'January 2024', 45.00, 'Paid', '2024-01-20'),
('550e8400-e29b-41d4-a716-446655440002', 'mike.jones@email.com', 'February 2024', 45.00, 'Overdue', NULL)
ON CONFLICT (id) DO NOTHING;

-- Verify the table was created successfully
SELECT 'Memberships table created successfully!' as status;
