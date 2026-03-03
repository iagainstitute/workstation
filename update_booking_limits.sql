-- Update booking settings to limit students to 3 hours per day
-- Run this in Supabase SQL Editor

-- First, check if booking_settings exists
CREATE TABLE IF NOT EXISTS booking_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    max_hours_per_day INTEGER DEFAULT 3,
    max_sessions_per_day INTEGER DEFAULT 3,
    slot_duration_minutes INTEGER DEFAULT 30,
    days_ahead_booking INTEGER DEFAULT 1,
    business_hours_start TIME DEFAULT '09:00',
    business_hours_end TIME DEFAULT '18:30',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert or update the active booking settings
INSERT INTO booking_settings (
    max_hours_per_day,
    max_sessions_per_day,
    slot_duration_minutes,
    days_ahead_booking,
    business_hours_start,
    business_hours_end,
    is_active
)
VALUES (
    3,      -- Max 3 hours per day per student
    3,      -- Max 3 sessions per day
    15,     -- 15 minute slots
    1,      -- Can book 1 day ahead (today and tomorrow)
    '09:00',
    '18:30',
    true
)
ON CONFLICT (id) DO UPDATE SET
    max_hours_per_day = 3,
    max_sessions_per_day = 3,
    updated_at = NOW();

-- If there are multiple rows, deactivate all and insert a new active one
UPDATE booking_settings SET is_active = false;

INSERT INTO booking_settings (
    max_hours_per_day,
    max_sessions_per_day,
    slot_duration_minutes,
    days_ahead_booking,
    business_hours_start,
    business_hours_end,
    is_active
)
VALUES (3, 3, 15, 1, '09:00', '18:30', true)
RETURNING *;

-- Verify the settings
SELECT * FROM booking_settings WHERE is_active = true;
