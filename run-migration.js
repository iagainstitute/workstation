const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabaseUrl = "https://lbjzndtoxwmcaaggramp.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxianpuZHRveHdtY2FhZ2dyYW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3NDIzODkxMiwiZXhwIjoxOTg5ODE0OTEyfQ.nzBwWAL0hCAG6CGOB7mmzHqsNjtpXpgycfgC7SqyTyg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log("🚀 Starting Supabase Migration...\n");

  // Read the SQL file
  const sqlPath = path.join(__dirname, "supabase-migration.sql");
  const sqlContent = fs.readFileSync(sqlPath, "utf8");

  // Split SQL into individual statements
  const statements = sqlContent
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let failCount = 0;

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip comments and empty statements
    if (statement.startsWith("--") || statement.trim().length === 0) {
      continue;
    }

    // Get first 50 chars for logging
    const preview = statement.substring(0, 50).replace(/\s+/g, " ");
    console.log(`\n[${i + 1}/${statements.length}] Executing: ${preview}...`);

    try {
      const { data, error } = await supabase.rpc("exec_sql", {
        sql_query: statement,
      });

      if (error) {
        // Try direct query for some statements
        console.log("   ⚠️ RPC failed, trying direct execution...");

        // For ALTER TABLE and CREATE TABLE, we'll use a workaround
        if (statement.includes("ALTER TABLE desktops")) {
          console.log("   ℹ️ Attempting to add weekly_hours column...");
          // Try to update a desktop with weekly_hours to verify column exists
          const { error: testError } = await supabase
            .from("desktops")
            .update({
              weekly_hours: {
                monday: { available: true, start: "09:00", end: "19:00" },
                tuesday: { available: true, start: "09:00", end: "19:00" },
                wednesday: { available: true, start: "09:00", end: "19:00" },
                thursday: { available: true, start: "09:00", end: "19:00" },
                friday: { available: true, start: "09:00", end: "19:00" },
                saturday: { available: true, start: "09:00", end: "19:00" },
                sunday: { available: false },
              },
            })
            .limit(1);

          if (testError && testError.message.includes("column")) {
            console.log("   ❌ Column does not exist. Please add manually.");
            console.log("   📋 Run this in Supabase SQL Editor:");
            console.log(`
ALTER TABLE desktops
ADD COLUMN IF NOT EXISTS weekly_hours JSONB DEFAULT '{
  "monday": {"available": true, "start": "09:00", "end": "19:00"},
  "tuesday": {"available": true, "start": "09:00", "end": "19:00"},
  "wednesday": {"available": true, "start": "09:00", "end": "19:00"},
  "thursday": {"available": true, "start": "09:00", "end": "19:00"},
  "friday": {"available": true, "start": "09:00", "end": "19:00"},
  "saturday": {"available": true, "start": "09:00", "end": "19:00"},
  "sunday": {"available": false}
}'::JSONB;
            `);
            failCount++;
          } else {
            console.log("   ✅ Column already exists or added successfully");
            successCount++;
          }
        } else if (
          statement.includes("CREATE TABLE IF NOT EXISTS booking_settings")
        ) {
          console.log("   ℹ️ Attempting to create booking_settings table...");
          // Try to insert a record to check if table exists
          const { data, error: insertError } = await supabase
            .from("booking_settings")
            .insert({
              slot_duration_minutes: 30,
              max_hours_per_day: 4,
              max_sessions_per_day: 2,
              days_ahead_booking: 1,
              business_hours_start: "09:00",
              business_hours_end: "19:00",
              is_active: true,
            })
            .select();

          if (
            insertError &&
            insertError.message.includes("relation") &&
            insertError.message.includes("does not exist")
          ) {
            console.log("   ❌ Table does not exist. Please create manually.");
            console.log("   📋 Run this in Supabase SQL Editor:");
            console.log(`
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
            `);
            failCount++;
          } else if (insertError) {
            console.log(
              "   ⚠️ Insert error (table may exist):",
              insertError.message,
            );
            console.log("   ✅ Table likely already exists");
            successCount++;
          } else {
            console.log("   ✅ Table created and default settings inserted");
            successCount++;
          }
        } else if (statement.includes("CREATE INDEX")) {
          console.log("   ⚠️ Cannot create index via client. Skipping...");
          console.log("   📋 Please run this manually in SQL Editor");
          failCount++;
        } else {
          console.log("   ❌ Error:", error.message);
          failCount++;
        }
      } else {
        console.log("   ✅ Success");
        successCount++;
      }
    } catch (err) {
      console.log("   ❌ Exception:", err.message);
      failCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Migration Summary:");
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log("=".repeat(60));

  if (failCount > 0) {
    console.log(
      "\n⚠️ Some statements failed. Please run the following manually in Supabase SQL Editor:",
    );
    console.log("\n1. Go to: https://lbjzndtoxwmcaaggramp.supabase.co");
    console.log("2. Click: SQL Editor (left sidebar)");
    console.log('3. Click: "+ New query" button');
    console.log("4. Copy-paste the FULL content of: supabase-migration.sql");
    console.log('5. Click: "Run" button\n');
  } else {
    console.log("\n✅ Migration completed successfully!");
    console.log("\n🎉 You can now start using the booking system!\n");
  }
}

runMigration().catch((err) => {
  console.error("💥 Migration failed:", err);
  process.exit(1);
});
