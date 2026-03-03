-- SQL Script to Add 3 Desktops for 2D Type and 3 Desktops for 3D Type
-- Run this in Supabase SQL Editor

-- First, let's get the desktop type IDs
-- This will help us reference them correctly

-- Add 3 desktops for 2D - Basic type
INSERT INTO desktops (desktop_name, desktop_type_id, status, is_active, weekly_hours)
SELECT
  'Desktop 2',
  id,
  'available',
  true,
  jsonb_build_object(
    'monday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'tuesday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'wednesday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'thursday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'friday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'saturday', jsonb_build_object('available', false),
    'sunday', jsonb_build_object('available', false)
  )
FROM desktop_types
WHERE display_name = '2D - Basic'
ON CONFLICT DO NOTHING;

INSERT INTO desktops (desktop_name, desktop_type_id, status, is_active, weekly_hours)
SELECT
  'Desktop 3',
  id,
  'available',
  true,
  jsonb_build_object(
    'monday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'tuesday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'wednesday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'thursday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'friday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'saturday', jsonb_build_object('available', false),
    'sunday', jsonb_build_object('available', false)
  )
FROM desktop_types
WHERE display_name = '2D - Basic'
ON CONFLICT DO NOTHING;

INSERT INTO desktops (desktop_name, desktop_type_id, status, is_active, weekly_hours)
SELECT
  'Desktop 4',
  id,
  'available',
  true,
  jsonb_build_object(
    'monday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'tuesday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'wednesday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'thursday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'friday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'saturday', jsonb_build_object('available', false),
    'sunday', jsonb_build_object('available', false)
  )
FROM desktop_types
WHERE display_name = '2D - Basic'
ON CONFLICT DO NOTHING;

-- Add 3 desktops for 3D - Basic type
INSERT INTO desktops (desktop_name, desktop_type_id, status, is_active, weekly_hours)
SELECT
  '3D Desktop 1',
  id,
  'available',
  true,
  jsonb_build_object(
    'monday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'tuesday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'wednesday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'thursday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'friday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'saturday', jsonb_build_object('available', false),
    'sunday', jsonb_build_object('available', false)
  )
FROM desktop_types
WHERE display_name = '3D - Basic'
ON CONFLICT DO NOTHING;

INSERT INTO desktops (desktop_name, desktop_type_id, status, is_active, weekly_hours)
SELECT
  '3D Desktop 2',
  id,
  'available',
  true,
  jsonb_build_object(
    'monday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'tuesday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'wednesday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'thursday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'friday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'saturday', jsonb_build_object('available', false),
    'sunday', jsonb_build_object('available', false)
  )
FROM desktop_types
WHERE display_name = '3D - Basic'
ON CONFLICT DO NOTHING;

INSERT INTO desktops (desktop_name, desktop_type_id, status, is_active, weekly_hours)
SELECT
  '3D Desktop 3',
  id,
  'available',
  true,
  jsonb_build_object(
    'monday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'tuesday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'wednesday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'thursday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'friday', jsonb_build_object('available', true, 'start', '09:00', 'end', '19:00'),
    'saturday', jsonb_build_object('available', false),
    'sunday', jsonb_build_object('available', false)
  )
FROM desktop_types
WHERE display_name = '3D - Basic'
ON CONFLICT DO NOTHING;

-- Verify the desktops were added
SELECT
  d.desktop_name,
  dt.display_name as type,
  d.status,
  d.is_active
FROM desktops d
JOIN desktop_types dt ON d.desktop_type_id = dt.id
WHERE dt.display_name IN ('2D - Basic', '3D - Basic')
ORDER BY dt.display_name, d.desktop_name;
