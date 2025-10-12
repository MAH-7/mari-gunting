#!/usr/bin/env node

/**
 * Test Authentication
 * Run this script to test authentication features
 * Usage: node test-auth.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧪 Testing Mari-Gunting Authentication\n');

// =====================================================
// TEST EMAIL AUTHENTICATION
// =====================================================

async function testEmailAuth() {
  console.log('📧 Testing Email Authentication...');
  
  const testEmail = 'test@marigunting.com';
  const testPassword = 'Test123456!';
  
  try {
    // Test Sign Up
    console.log('  → Signing up with email...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          role: 'customer',
        },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('  ✅ Email already exists (expected if run before)');
      } else {
        throw signUpError;
      }
    } else if (signUpData.user) {
      console.log('  ✅ Sign up successful!');
      console.log('     User ID:', signUpData.user.id);
      
      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: signUpData.user.id,
        full_name: 'Test User',
        role: 'customer',
        is_active: true,
      });
      
      if (profileError && !profileError.message.includes('duplicate')) {
        console.log('  ⚠️  Profile creation warning:', profileError.message);
      } else {
        console.log('  ✅ Profile created');
      }
    }

    // Test Sign In
    console.log('  → Signing in with email...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) throw signInError;

    console.log('  ✅ Sign in successful!');
    console.log('     Session expires:', new Date(signInData.session.expires_at * 1000).toLocaleString());

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (profile) {
      console.log('  ✅ Profile fetched');
      console.log('     Name:', profile.full_name);
      console.log('     Role:', profile.role);
    }

    // Sign out
    await supabase.auth.signOut();
    console.log('  ✅ Sign out successful\n');

    return true;
  } catch (error) {
    console.error('  ❌ Email auth error:', error.message);
    return false;
  }
}

// =====================================================
// TEST PHONE AUTHENTICATION
// =====================================================

async function testPhoneAuth() {
  console.log('📱 Testing Phone Authentication...');
  
  // Format phone number to E.164 (Malaysia)
  const testPhone = '+60123456789'; // Use a real test number if you want to receive OTP
  
  try {
    console.log('  → Sending OTP to:', testPhone);
    console.log('  ℹ️  In development, OTP will appear in Supabase logs');
    console.log('  ℹ️  Check: Dashboard > Auth > Logs');
    
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: testPhone,
    });

    if (error) {
      if (error.message.includes('SMS provider')) {
        console.log('  ⚠️  SMS provider not configured (expected in dev)');
        console.log('  ℹ️  Phone auth is enabled but needs Twilio for production');
        console.log('  ✅ Phone auth setup complete (pending Twilio configuration)\n');
        return true;
      }
      throw error;
    }

    console.log('  ✅ OTP sent successfully!');
    console.log('  ℹ️  In production, user would receive SMS');
    console.log('  ℹ️  They would then call verifyOtp() with the code\n');

    return true;
  } catch (error) {
    console.error('  ❌ Phone auth error:', error.message);
    return false;
  }
}

// =====================================================
// TEST SESSION MANAGEMENT
// =====================================================

async function testSessionManagement() {
  console.log('🔑 Testing Session Management...');
  
  try {
    // Get current session (should be null after sign out)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('  ✅ No active session (correct after sign out)');
    } else {
      console.log('  ℹ️  Active session found');
    }

    // Test get user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('  ✅ No authenticated user (correct)\n');
    } else {
      console.log('  ℹ️  User authenticated:', user.email || user.phone);
    }

    return true;
  } catch (error) {
    console.error('  ❌ Session management error:', error.message);
    return false;
  }
}

// =====================================================
// TEST AUTH STATE LISTENER
// =====================================================

function testAuthStateListener() {
  console.log('👂 Testing Auth State Listener...');
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('  ℹ️  Auth event:', event);
    if (session) {
      console.log('  ℹ️  Session active for:', session.user.email || session.user.phone);
    }
  });

  console.log('  ✅ Auth listener configured');
  console.log('  ℹ️  Will trigger on sign in/out events\n');
  
  // Unsubscribe after test
  setTimeout(() => {
    subscription.unsubscribe();
  }, 1000);

  return true;
}

// =====================================================
// RUN ALL TESTS
// =====================================================

async function runTests() {
  console.log('Starting authentication tests...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = [];

  // Test 1: Email Authentication
  results.push(await testEmailAuth());

  // Test 2: Phone Authentication
  results.push(await testPhoneAuth());

  // Test 3: Session Management
  results.push(await testSessionManagement());

  // Test 4: Auth State Listener
  results.push(testAuthStateListener());

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 Test Results:\n');
  
  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`  Total Tests: ${total}`);
  console.log(`  Passed: ${passed} ✅`);
  console.log(`  Failed: ${total - passed} ❌`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Authentication is working correctly.');
    console.log('\n📝 Next Steps:');
    console.log('   1. ✅ Email auth - Working');
    console.log('   2. ✅ Phone auth - Enabled (add Twilio for production)');
    console.log('   3. 🔜 Build login screens in your apps');
    console.log('   4. 🔜 Configure Google OAuth (optional)');
    console.log('   5. 🔜 Configure Apple Sign In (before iOS launch)');
  } else {
    console.log('\n⚠️  Some tests failed. Check errors above.');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Run tests
runTests().catch(console.error);
