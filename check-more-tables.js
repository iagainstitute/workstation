const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lbjzndtoxwmcaaggramp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxianpuZHRveHdtY2FhZ2dyYW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3NDIzODkxMiwiZXhwIjoxOTg5ODE0OTEyfQ.nzBwWAL0hCAG6CGOB7mmzHqsNjtpXpgycfgC7SqyTyg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMore() {
  console.log('🔍 Checking additional tables...\n');

  // Check branches
  const { data: branches } = await supabase.from('branches').select('*').limit(1);
  if (branches && branches.length > 0) {
    console.log('✅ branches table:', Object.keys(branches[0]));
  }

  // Check booking_settings
  const { data: settings } = await supabase.from('booking_settings').select('*').limit(1);
  if (settings) {
    console.log('✅ booking_settings table exists');
  } else {
    console.log('❌ booking_settings table NOT found (need to create)');
  }

  // Get sample desktop data
  const { data: desktops } = await supabase.from('desktops').select('*').limit(1);
  if (desktops && desktops.length > 0) {
    console.log('\n📋 Sample desktop:', JSON.stringify(desktops[0], null, 2));
  }

  // Get sample desktop_type
  const { data: types } = await supabase.from('desktop_types').select('*').limit(1);
  if (types && types.length > 0) {
    console.log('\n📋 Sample desktop_type:', JSON.stringify(types[0], null, 2));
  }
}

checkMore();
