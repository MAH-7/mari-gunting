/**
 * Script to check barber availability status in the database
 * This helps debug why no barbers are showing up in the customer app
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBarbers() {
  console.log('\n🔍 Checking barber availability status...\n');

  // 1. Check all profiles
  console.log('1️⃣ Checking all profiles:');
  const { data: profiles, error: profilesError} = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_online, last_seen_at');

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError);
    return;
  }

  console.log(`   Found ${profiles?.length || 0} total profiles\n`);

  // 2. Check all barbers
  console.log('2️⃣ Checking all barber records:');
  const { data: barbers, error: barbersError } = await supabase
    .from('barbers')
    .select('id, user_id, is_available, is_verified, rating, total_reviews, completed_bookings');

  if (barbersError) {
    console.error('❌ Error fetching barbers:', barbersError);
    return;
  }

  console.log(`   Found ${barbers?.length || 0} barber records\n`);
  barbers?.forEach((b, i) => {
    console.log(`   ${i + 1}. Barber ID: ${b.id}`);
    console.log(`      User ID: ${b.user_id}`);
    console.log(`      Is Available: ${b.is_available ? '✅' : '❌'}`);
    console.log(`      Is Verified: ${b.is_verified ? '✅' : '❌'}`);
    console.log(`      Rating: ${b.rating || 0} (${b.total_reviews || 0} reviews)`);
    console.log(`      Completed Bookings: ${b.completed_bookings || 0}\n`);
  });

  // 3. Check barbers with their profiles (JOIN)
  console.log('3️⃣ Checking barbers with profile data:');
  const { data: barbersWithProfiles, error: joinError } = await supabase
    .from('barbers')
    .select(`
      *,
      profile:profiles!barbers_user_id_fkey(
        id,
        full_name,
        email,
        role,
        is_online
      )
    `);

  if (joinError) {
    console.error('❌ Error fetching joined data:', joinError);
    return;
  }

  console.log(`   Found ${barbersWithProfiles?.length || 0} barbers with profiles\n`);
  barbersWithProfiles?.forEach((b, i) => {
    console.log(`   ${i + 1}. ${b.profile?.full_name || 'Unknown'}`);
    console.log(`      User ID: ${b.user_id}`);
    console.log(`      Profile Role: ${b.profile?.role || 'N/A'}`);
    console.log(`      Profile is_online: ${b.profile?.is_online ? '✅' : '❌'}`);
    console.log(`      Barber is_available: ${b.is_available ? '✅' : '❌'}`);
    
    const meetsCustomerAppFilters = b.profile?.is_online && b.is_available;
    console.log(`      Meets customer app filters: ${meetsCustomerAppFilters ? '✅' : '❌'}\n`);
  });

  // 4. Check services for barbers
  console.log('4️⃣ Checking services:');
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, barber_id, name, price, is_active');

  if (servicesError) {
    console.error('❌ Error fetching services:', servicesError);
    return;
  }

  console.log(`   Found ${services?.length || 0} services\n`);
  
  // Group services by barber
  const servicesByBarber = {};
  services?.forEach(s => {
    if (!servicesByBarber[s.barber_id]) {
      servicesByBarber[s.barber_id] = [];
    }
    servicesByBarber[s.barber_id].push(s);
  });

  Object.entries(servicesByBarber).forEach(([barberId, barberServices]) => {
    console.log(`   Barber ${barberId}: ${barberServices.length} services`);
    barberServices.forEach(s => {
      console.log(`      - ${s.name}: RM ${s.price} (${s.is_active ? 'Active' : 'Inactive'})`);
    });
    console.log('');
  });

  // 5. Summary
  console.log('📊 SUMMARY:');
  const totalProfiles = profiles?.length || 0;
  const onlineProfiles = profiles?.filter(p => p.is_online).length || 0;
  const totalBarbers = barbers?.length || 0;
  const availableBarbers = barbers?.filter(b => b.is_available).length || 0;
  const barbersWithBothOnlineAndAvailable = barbersWithProfiles?.filter(
    b => b.profile?.is_online && b.is_available
  ).length || 0;

  console.log(`   Total profiles: ${totalProfiles}`);
  console.log(`   Online profiles: ${onlineProfiles}`);
  console.log(`   Total barber records: ${totalBarbers}`);
  console.log(`   Available barbers (barbers.is_available): ${availableBarbers}`);
  console.log(`   Barbers that meet customer app filters (online AND available): ${barbersWithBothOnlineAndAvailable}`);
  
  if (barbersWithBothOnlineAndAvailable === 0) {
    console.log('\n⚠️  NO BARBERS MEET THE CUSTOMER APP FILTERS!');
    console.log('   To fix this, you need to:');
    console.log('   1. Make sure at least one barber has is_available = true in the barbers table');
    console.log('   2. Make sure that same barber\'s profile has is_online = true in the profiles table');
    console.log('   3. You can do this by:');
    console.log('      - Using the partner app to toggle online status (recommended)');
    console.log('      - The partner app calls toggle_online_status() which updates both tables');
    console.log('');
    console.log('   Or manually in the database:');
    if (barbers && barbers.length > 0) {
      const firstBarber = barbers[0];
      console.log(`      UPDATE barbers SET is_available = true WHERE id = '${firstBarber.id}';`);
      console.log(`      UPDATE profiles SET is_online = true WHERE id = '${firstBarber.user_id}';`);
    }
  } else {
    console.log(`\n✅ ${barbersWithBothOnlineAndAvailable} barber(s) should be visible in the customer app!`);
  }
}

checkBarbers()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
