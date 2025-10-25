// Debug script to check heartbeat data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/partner/.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHeartbeat() {
  console.log('🔍 Checking heartbeat data...\n');
  
  // Get all online barbers with their heartbeat
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, is_online, last_heartbeat, role')
    .eq('is_online', true)
    .eq('role', 'barber');
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`Found ${profiles.length} online barbers:\n`);
  
  profiles.forEach(profile => {
    const lastHeartbeat = profile.last_heartbeat ? new Date(profile.last_heartbeat) : null;
    const now = new Date();
    const minutesAgo = lastHeartbeat ? (now - lastHeartbeat) / 1000 / 60 : null;
    
    console.log(`👤 ${profile.full_name || profile.id}`);
    console.log(`   ID: ${profile.id}`);
    console.log(`   Online: ${profile.is_online}`);
    console.log(`   Last heartbeat: ${lastHeartbeat ? lastHeartbeat.toLocaleString() : 'NULL'}`);
    console.log(`   Minutes ago: ${minutesAgo ? minutesAgo.toFixed(1) : 'N/A'}`);
    console.log(`   Status: ${minutesAgo && minutesAgo > 3 ? '❌ STALE (>3 min)' : '✅ ACTIVE'}\n`);
  });
  
  // Check if last_heartbeat column exists
  const { data: columns, error: colError } = await supabase
    .from('profiles')
    .select('last_heartbeat')
    .limit(1);
  
  if (colError && colError.message.includes('column')) {
    console.log('❌ ERROR: last_heartbeat column does NOT exist in profiles table!');
    console.log('   You need to run the migration: supabase/migrations/20250124_heartbeat_auto_offline.sql');
  } else {
    console.log('✅ last_heartbeat column exists');
  }
}

checkHeartbeat().then(() => process.exit(0));
