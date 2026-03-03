const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lbjzndtoxwmcaaggramp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxianpuZHRveHdtY2FhZ2dyYW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3NDIzODkxMiwiZXhwIjoxOTg5ODE0OTEyfQ.nzBwWAL0hCAG6CGOB7mmzHqsNjtpXpgycfgC7SqyTyg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Checking desktop_types table...\n');

  // Check desktop_types
  const { data: types, error: typesError } = await supabase
    .from('desktop_types')
    .select('*')
    .limit(3);

  if (typesError) {
    console.log('❌ Error fetching desktop_types:', typesError.message);
  } else if (types && types.length > 0) {
    console.log('✅ desktop_types table found!');
    console.log('📋 Columns:', Object.keys(types[0]));
    console.log('📄 Sample data:', types);
  } else {
    console.log('⚠️ desktop_types table is empty');
  }

  console.log('\n🔍 Checking desktops table...\n');

  // Check desktops
  const { data: desktops, error: desktopsError } = await supabase
    .from('desktops')
    .select('*')
    .limit(1);

  if (desktopsError) {
    console.log('❌ Error fetching desktops:', desktopsError.message);
  } else if (desktops && desktops.length > 0) {
    console.log('✅ desktops table found!');
    console.log('📋 Columns:', Object.keys(desktops[0]));
  } else {
    console.log('⚠️ desktops table is empty');
  }
}

checkTables();
