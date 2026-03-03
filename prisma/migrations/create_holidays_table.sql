-- Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on date for faster lookups
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_active ON holidays(is_active);

-- Insert some default holidays
INSERT INTO holidays (title, date, is_recurring, description) VALUES
('New Year''s Day', '2026-01-01', TRUE, 'New Year celebration'),
('Republic Day', '2026-01-26', TRUE, 'India Republic Day'),
('Independence Day', '2026-08-15', TRUE, 'India Independence Day'),
('Gandhi Jayanti', '2026-10-02', TRUE, 'Mahatma Gandhi''s Birthday'),
('Diwali', '2026-11-05', FALSE, 'Festival of Lights'),
('Christmas', '2026-12-25', TRUE, 'Christmas Day')
ON CONFLICT DO NOTHING;

-- Add RLS policies
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (public)
CREATE POLICY "Public can view active holidays" ON holidays
    FOR SELECT
    USING (is_active = TRUE);

-- Allow admin to manage holidays (you'll need to adjust this based on your auth setup)
CREATE POLICY "Admins can manage holidays" ON holidays
    FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);
