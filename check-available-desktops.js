const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lbjzndtoxwmcaaggramp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxianpuZHRveHdtY2FhZ2dyYW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3NDIzODkxMiwiZXhwIjoxOTg5ODE0OTEyfQ.nzBwWAL0hCAG6CGOB7mmzHqsNjtpXpgycfgC7SqyTyg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDesktops() {
  console.log('🔍 Checking available desktops...\n');

  // Get all desktops
  const { data: desktops, error } = await supabase
    .from('desktops')
    .select('*, desktop_type:desktop_types(*)')
    .order('created_at');

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log(`📊 Total desktops: ${desktops.length}\n`);

  // Group by status
  const byStatus = {};
  desktops.forEach(d => {
    byStatus[d.status] = (byStatus[d.status] || 0) + 1;
  });

  console.log('📈 By Status:');
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });

  // Show available desktops
  const available = desktops.filter(d => d.status === 'available');
  console.log(`\n✅ Available desktops: ${available.length}`);

  if (available.length > 0) {
    console.log('\nAvailable Desktops:');
    available.forEach(d => {
      console.log(`   - ${d.desktop_name} (Type: ${d.desktop_type?.display_name || 'N/A'})`);
      console.log(`     Status: ${d.status}, Active: ${d.is_active}`);
      console.log(`     Has weekly_hours: ${!!d.weekly_hours}`);
    });
  } else {
    console.log('\n⚠️ NO AVAILABLE DESKTOPS FOUND!');
    console.log('\nAll desktops:');
    desktops.forEach(d => {
      console.log(`   - ${d.desktop_name}`);
      console.log(`     Status: ${d.status}, Active: ${d.is_active}`);
      console.log(`     Type: ${d.desktop_type?.display_name || 'N/A'}`);
    });
  }

  // Check "2D - Basic" type specifically
  const basicDesktops = desktops.filter(d =>
    d.desktop_type?.display_name?.includes('2D') &&
    d.desktop_type?.display_name?.includes('Basic')
  );

  console.log(`\n🔍 "2D - Basic" type desktops: ${basicDesktops.length}`);
  if (basicDesktops.length > 0) {
    basicDesktops.forEach(d => {
      console.log(`   - ${d.desktop_name}: ${d.status}`);
    });
  }
}

checkDesktops();
