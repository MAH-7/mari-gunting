/**
 * Quick Fix Script: Update Verification Status to Pending
 * 
 * Run this to manually set your account status to 'pending' without resubmitting
 * 
 * Usage:
 * node fix-verification-status.js YOUR_USER_ID
 */

const { createClient } = require('@supabase/supabase-js');

// Get your Supabase credentials from packages/shared/config/supabase.ts
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixVerificationStatus(userId) {
  console.log('🔧 Fixing verification status for user:', userId);
  
  // Try to update barber (freelance)
  const { data: barber, error: barberError } = await supabase
    .from('barbers')
    .update({ verification_status: 'pending' })
    .eq('user_id', userId)
    .select();
  
  if (barber && barber.length > 0) {
    console.log('✅ Updated barber (freelance) status to pending');
    console.log('Updated record:', barber[0]);
    return;
  }
  
  // Try to update barbershop
  const { data: barbershop, error: shopError } = await supabase
    .from('barbershops')
    .update({ verification_status: 'pending' })
    .eq('owner_id', userId)
    .select();
  
  if (barbershop && barbershop.length > 0) {
    console.log('✅ Updated barbershop status to pending');
    console.log('Updated record:', barbershop[0]);
    return;
  }
  
  console.error('❌ No barber or barbershop found for user:', userId);
  console.error('Barber error:', barberError);
  console.error('Shop error:', shopError);
}

// Get user ID from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide user ID as argument');
  console.error('Usage: node fix-verification-status.js YOUR_USER_ID');
  console.error('\nYou can find your user ID in the console logs:');
  console.error('Look for: "🔍 Checking verification status for: USER_ID_HERE"');
  process.exit(1);
}

fixVerificationStatus(userId)
  .then(() => {
    console.log('\n✅ Done! Restart your app and you should go to "Account Under Review"');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
