-- Finances table schema for Raising My Rescue app
-- Run this in your Supabase SQL Editor to create the finances table

-- Create finances table
CREATE TABLE IF NOT EXISTS finances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month VARCHAR(20) NOT NULL, -- e.g., "June", "July"
    year INTEGER NOT NULL, -- e.g., 2025, 2024
    expected_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    actual_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_finances_year ON finances(year);
CREATE INDEX IF NOT EXISTS idx_finances_month ON finances(month);
CREATE INDEX IF NOT EXISTS idx_finances_year_month ON finances(year, month);

-- Create trigger for updated_at
CREATE TRIGGER update_finances_updated_at BEFORE UPDATE ON finances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on finances" ON finances
    FOR ALL USING (true);

-- Insert sample data based on your screenshots
INSERT INTO finances (month, year, expected_amount, actual_amount) VALUES
-- 2025/26 data
('June', 2025, 2600.00, 2520.00),
('July', 2025, 2000.00, 955.00),
('May', 2025, 2800.00, 2871.00),
('April', 2025, 1730.00, 1536.00),

-- 2024/25 data  
('April', 2024, 1730.00, 203.00),
('March', 2024, 1550.00, 1777.00),
('February', 2024, 1619.00, 1643.00),
('January', 2024, 1200.00, 1421.00),
('December', 2023, 900.00, 985.00),
('November', 2023, 900.00, 960.00),
('October', 2023, 757.00, 757.00)
ON CONFLICT (id) DO NOTHING;

-- Create finance_breakdown table for the pie chart data
CREATE TABLE IF NOT EXISTS finance_breakdown (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month VARCHAR(20) NOT NULL,
    year INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g., "In-Person", "Membership", "Online", "Coaching", "Training", "Online Catchup"
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    color VARCHAR(7) DEFAULT '#000000', -- Hex color for pie chart
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for finance_breakdown
CREATE INDEX IF NOT EXISTS idx_finance_breakdown_year_month ON finance_breakdown(year, month);
CREATE INDEX IF NOT EXISTS idx_finance_breakdown_category ON finance_breakdown(category);

-- Create trigger for finance_breakdown updated_at
CREATE TRIGGER update_finance_breakdown_updated_at BEFORE UPDATE ON finance_breakdown
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for finance_breakdown
ALTER TABLE finance_breakdown ENABLE ROW LEVEL SECURITY;

-- Create policy for finance_breakdown
CREATE POLICY "Allow all operations on finance_breakdown" ON finance_breakdown
    FOR ALL USING (true);

-- Insert sample breakdown data for June 2025 (from your screenshot)
INSERT INTO finance_breakdown (month, year, category, amount, color) VALUES
('June', 2025, 'In-Person', 915.00, '#B45309'),
('June', 2025, 'Membership', 260.00, '#2563EB'),
('June', 2025, 'Online', 70.00, '#16A34A'),
('June', 2025, 'Coaching', 735.00, '#DC2626'),
('June', 2025, 'Training', 70.00, '#0891B2'),
('June', 2025, 'Online Catchup', 30.00, '#7C2D12')
ON CONFLICT (id) DO NOTHING;

-- Verify the tables were created successfully
SELECT 'Finances tables created successfully!' as status;
