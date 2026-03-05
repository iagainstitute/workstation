-- Fix booking limit to 3 hours per day (not 4)
-- Run this in Supabase SQL Editor

-- Update the active booking settings to 3 hours max
UPDATE booking_settings
SET max_hours_per_day = 3,
    updated_at = NOW()
WHERE is_active = true;

-- Verify the change
SELECT
    id,
    max_hours_per_day,
    max_sessions_per_day,
    is_active,
    updated_at
FROM booking_settings
WHERE is_active = true;
