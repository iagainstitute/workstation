const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://lbjzndtoxwmcaaggramp.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxianpuZHRveHdtY2FhZ2dyYW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3NDIzODkxMiwiZXhwIjoxOTg5ODE0OTEyfQ.nzBwWAL0hCAG6CGOB7mmzHqsNjtpXpgycfgC7SqyTyg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log("🚀 Starting Supabase migration...\n");

  // 1. Add weekly_hours column to desktops table
  console.log("1️⃣ Adding weekly_hours column to desktops table...");

  const defaultWeeklyHours = {
    monday: { available: true, start: "09:00", end: "19:00" },
    tuesday: { available: true, start: "09:00", end: "19:00" },
    wednesday: { available: true, start: "09:00", end: "19:00" },
    thursday: { available: true, start: "09:00", end: "19:00" },
    friday: { available: true, start: "09:00", end: "19:00" },
    saturday: { available: true, start: "09:00", end: "19:00" },
    sunday: { available: false },
  };

  try {
    // Update all existing desktops with default weekly_hours
    const { data: existingDesktops } = await supabase
      .from("desktops")
      .select("id")
      .is("weekly_hours", null);

    if (existingDesktops && existingDesktops.length > 0) {
      for (const desktop of existingDesktops) {
        await supabase
          .from("desktops")
          .update({ weekly_hours: defaultWeeklyHours })
          .eq("id", desktop.id);
      }
      console.log(
        `   ✅ Updated ${existingDesktops.length} existing desktops with weekly_hours`,
      );
    } else {
      console.log("   ✅ All desktops already have weekly_hours");
    }
  } catch (err) {
    console.log("   ⚠️ Column might not exist yet, continuing...");
  }

  // 2. Create booking_settings table
  console.log("\n2️⃣ Creating booking_settings table...");

  try {
    // Insert default settings
    const { data, error } = await supabase
      .from("booking_settings")
      .insert([
        {
          slot_duration_minutes: 30,
          max_hours_per_day: 4,
          max_sessions_per_day: 2,
          days_ahead_booking: 1,
          business_hours_start: "09:00",
          business_hours_end: "19:00",
          is_active: true,
        },
      ])
      .select();

    if (error) {
      if (
        error.message.includes("relation") &&
        error.message.includes("does not exist")
      ) {
        console.log(
          "   ❌ Table does not exist. Please create it manually in Supabase Dashboard.",
        );
        console.log("\n   Run this SQL in Supabase SQL Editor:");
        console.log(`
CREATE TABLE booking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_duration_minutes INT DEFAULT 30,
  max_hours_per_day NUMERIC DEFAULT 4,
  max_sessions_per_day INT DEFAULT 2,
  days_ahead_booking INT DEFAULT 1,
  business_hours_start TIME DEFAULT '09:00',
  business_hours_end TIME DEFAULT '19:00',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO booking_settings (
  slot_duration_minutes, max_hours_per_day, max_sessions_per_day,
  days_ahead_booking, business_hours_start, business_hours_end
) VALUES (30, 4, 2, 1, '09:00', '19:00');
        `);
      } else {
        console.log("   ✅ Settings already exist or table exists");
      }
    } else {
      console.log("   ✅ booking_settings table created with default values");
    }
  } catch (err) {
    console.log("   ⚠️ Error:", err.message);
  }

  // 3. Check for weekly_hours column
  console.log("\n3️⃣ Verifying weekly_hours column...");
  try {
    const { data } = await supabase
      .from("desktops")
      .select("id, weekly_hours")
      .limit(1);

    if (data && data[0] && data[0].weekly_hours) {
      console.log("   ✅ weekly_hours column exists and has data");
    } else {
      console.log("   ⚠️ weekly_hours column exists but is empty");
      console.log("   Run this SQL in Supabase to add column:");
      console.log(`
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
      `);
    }
  } catch (err) {
    console.log("   ❌ Column does not exist. Please add it manually.");
  }

  console.log("\n✅ Migration check complete!\n");
}

migrate();
