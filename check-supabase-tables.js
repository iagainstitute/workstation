const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lbjzndtoxwmcaaggramp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxianpuZHRveHdtY2FhZ2dyYW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3NDIzODkxMiwiZXhwIjoxOTg5ODE0OTEyfQ.nzBwWAL0hCAG6CGOB7mmzHqsNjtpXpgycfgC7SqyTyg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Checking Supabase tables...\n');

  // Check all tables
  const tables = [
    'desktop_allocations',
    'desktop_allocation',
    'desktops',
    'desktop',
    'desktop_types',
    'desktop_type',
    'desktop_history',
    'workstations',
    'workstation_bookings',
  ];

  for (const tableName of tables) {
    try {
      const { data, error } = await supabase.from(tableName).select('*').limit(1);

      if (!error) {
        console.log(`✅ Table found: ${tableName}`);
        if (data && data.length > 0) {
          console.log(`   Sample row:`, Object.keys(data[0]));
        } else {
          console.log(`   (Empty table)`);
        }
        console.log('');
      }
    } catch (err) {
      // Table doesn't exist, skip
    }
  }

  // List all public tables using PostgREST
  try {
    const { data, error } = await supabase.rpc('_list_tables');
  } catch (err) {
    console.log('\n📋 Cannot list all tables directly.');
  }
}

checkTables();
