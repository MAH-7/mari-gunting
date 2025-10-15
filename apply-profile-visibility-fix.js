/**
 * Script to fix barber profile visibility for anonymous users
 * This fixes the issue where customer app cannot see any barbers
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  console.error('\n⚠️  You need the SERVICE_ROLE_KEY to run this migration!');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('\n🔧 Applying barber profile visibility fix...\n');

  try {
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      './supabase/migrations/fix_barber_profile_visibility.sql',
      'utf8'
    );

    console.log('📄 Migration SQL:');
    console.log(migrationSQL);
    console.log('\n');

    // Execute the migration
    // Note: Supabase JS client doesn't support raw SQL execution directly
    // We need to use the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Migration failed: ${response.statusText}\n${errorText}`);
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n');

    // Verify by checking current policies
    console.log('🔍 Verifying policies...');
    
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'profiles');

    if (policiesError) {
      console.error('⚠️  Could not verify policies:', policiesError.message);
    } else {
      console.log(`✅ Found ${policies?.length || 0} policies on profiles table`);
      policies?.forEach(p => {
        console.log(`   - ${p.policyname}`);
      });
    }

    console.log('\n✅ All done! Try fetching barbers from the customer app now.');

  } catch (error) {
    console.error('\n❌ Error applying migration:', error);
    console.error('\n💡 Alternative: Apply the migration manually via Supabase Dashboard:');
    console.error('   1. Go to https://supabase.com/dashboard');
    console.error('   2. Select your project');
    console.error('   3. Go to SQL Editor');
    console.error('   4. Copy and paste the content of:');
    console.error('      supabase/migrations/fix_barber_profile_visibility.sql');
    console.error('   5. Click "Run"');
    process.exit(1);
  }
}

applyMigration()
  .then(() => {
    console.log('\n✅ Script complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script error:', error);
    process.exit(1);
  });
