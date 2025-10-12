#!/usr/bin/env node

/**
 * Test Supabase Connection
 * Run this script to verify Supabase is configured correctly
 * Usage: node test-supabase.js
 */

require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Configuration...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('  SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('  SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Please create a .env file with:');
  console.error('  EXPO_PUBLIC_SUPABASE_URL=your-url');
  console.error('  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key');
  process.exit(1);
}

// Test connection (simple fetch test)
console.log('Testing connection to:', SUPABASE_URL);

fetch(`${SUPABASE_URL}/rest/v1/`, {
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  },
})
  .then(response => {
    if (response.ok || response.status === 404) {
      console.log('✅ Supabase connection successful!');
      console.log('   Status:', response.status);
      console.log('   Supabase is configured and reachable');
      console.log('');
      console.log('🎉 You can now proceed with database schema setup!');
    } else {
      console.error('❌ Supabase connection failed');
      console.error('   Status:', response.status);
      console.error('   Please check your credentials');
    }
  })
  .catch(error => {
    console.error('❌ Connection error:', error.message);
    console.error('   Please check your internet connection and credentials');
  });
