-- =====================================================
-- WORKSTATION BOOKING SYSTEM - DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add weekly_hours column to desktops table
-- =====================================================
ALTER TABLE desktops
ADD COLUMN IF NOT EXISTS weekly_hours JSONB DEFAULT '{
  "monday": {"available": true, "start": "09:00", "end": "19:00"},
  "tuesday": {"available": true, "start": "09:00", "end": "19:00"},
  "wednesday": {"available": true, "start": "09:00", "end": "19:00"},
  "thursday": {"available": true, "start": "09:00", "end": "19:00"},
  "friday": {"available": true, "start": "09:00", "end": "19:00"},
  "saturday": {"available": false},
  "sunday": {"available": false}
}'::JSONB;

-- Update existing desktops with default weekly_hours
UPDATE desktops
SET weekly_hours = '{
  "monday": {"available": true, "start": "09:00", "end": "19:00"},
  "tuesday": {"available": true, "start": "09:00", "end": "19:00"},
  "wednesday": {"available": true, "start": "09:00", "end": "19:00"},
  "thursday": {"available": true, "start": "09:00", "end": "19:00"},
  "friday": {"available": true, "start": "09:00", "end": "19:00"},
  "saturday": {"available": false},
  "sunday": {"available": false}
}'::JSONB
WHERE weekly_hours IS NULL;

-- 2. Create booking_settings table
-- =====================================================
CREATE TABLE IF NOT EXISTS booking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_duration_minutes INT DEFAULT 30 NOT NULL,
  max_hours_per_day NUMERIC DEFAULT 4 NOT NULL,
  max_sessions_per_day INT DEFAULT 2 NOT NULL,
  days_ahead_booking INT DEFAULT 1 NOT NULL,
  business_hours_start TIME DEFAULT '09:00' NOT NULL,
  business_hours_end TIME DEFAULT '19:00' NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default settings
INSERT INTO booking_settings (
  slot_duration_minutes,
  max_hours_per_day,
  max_sessions_per_day,
  days_ahead_booking,
  business_hours_start,
  business_hours_end,
  is_active
)
VALUES (30, 4, 2, 1, '09:00', '19:00', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Add indexes for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_desktop_allocations_student_id
  ON desktop_allocations(student_id);

CREATE INDEX IF NOT EXISTS idx_desktop_allocations_desktop_id
  ON desktop_allocations(desktop_id);

CREATE INDEX IF NOT EXISTS idx_desktop_allocations_start_time
  ON desktop_allocations(start_time);

CREATE INDEX IF NOT EXISTS idx_desktop_allocations_status
  ON desktop_allocations(status);

CREATE INDEX IF NOT EXISTS idx_desktops_type_id
  ON desktops(desktop_type_id);

CREATE INDEX IF NOT EXISTS idx_desktops_status
  ON desktops(status);

-- 4. Create updated_at trigger for booking_settings
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_settings_updated_at
    BEFORE UPDATE ON booking_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Verify by running:
-- SELECT * FROM booking_settings;
-- SELECT id, desktop_name, weekly_hours FROM desktops LIMIT 5;
