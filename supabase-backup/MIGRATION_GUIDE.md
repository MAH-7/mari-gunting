# Mari Gunting Database Migration Guide

## Overview
This guide contains all the steps needed to migrate your Mari Gunting production database to a new Supabase account.

## Prerequisites
- New Supabase account created
- New project created in Supabase
- Supabase CLI installed
- PostgreSQL client tools (psql) installed

## Migration Steps

### 1. Create New Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project with your desired name
3. Save the following:
   - Project URL
   - Anon Key
   - Service Role Key
   - Database Password

### 2. Apply Database Schema

Connect to your new database using the connection string from the dashboard, then run:

```bash
# Using psql
psql [YOUR_NEW_CONNECTION_STRING] < schema/database_schema.sql

# Or using Supabase CLI
supabase db push --db-url [YOUR_NEW_CONNECTION_STRING]
```

### 3. Import TypeScript Types

Copy the generated types to your application:
```bash
cp types/database.types.ts [YOUR_APP_PATH]/types/supabase.ts
```

### 4. Create Storage Buckets

Review `storage/buckets.json` and create the same buckets in your new project:
1. Go to Storage in Supabase Dashboard
2. Create each bucket with the same names and settings

### 5. Update Application Configuration

Update your `.env` file with new credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=[NEW_PROJECT_URL]
EXPO_PUBLIC_SUPABASE_ANON_KEY=[NEW_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[NEW_SERVICE_ROLE_KEY]
```

### 6. Verify Migration

Test your application with the new Supabase instance:
1. Check all database connections
2. Verify authentication works
3. Test all API endpoints
4. Confirm storage operations

## Exported Files Structure

```
supabase-backup/
├── schema/
│   ├── api_schema.json        # Complete API schema
│   ├── api_definitions.json   # API endpoint definitions
│   ├── tables_list.json       # List of all tables
│   └── database_schema.sql    # SQL to recreate schema
├── types/
│   └── database.types.ts      # TypeScript type definitions
├── storage/
│   └── buckets.json          # Storage bucket configurations
├── auth/                     # Auth settings (if exported)
├── functions/                # Edge functions (if any)
└── policies/                 # RLS policies (if exported)
```

## Important Tables in Your Database

Based on the export, your database includes:
- active_tracking_sessions
- barber_onboarding
- barbers
- barbershop_onboarding
- barbershops
- booking_vouchers
- bookings
- credit_transactions
- customer_addresses
- customer_credits
- favorites
- messages
- notifications
- onboarding_verification_logs
- otp_requests
- payments
- payouts
- points_transactions
- profiles
- promotions
- review_likes
- reviews
- services
- tracking_history
- user_points
- user_vouchers
- vouchers

## Notes

1. **Data Migration**: This backup contains schema only. If you need to migrate data, you'll need to export/import it separately.

2. **RLS Policies**: Row Level Security policies need to be manually reviewed and applied after schema creation.

3. **Functions & Triggers**: Custom database functions and triggers may need to be manually recreated.

4. **Edge Functions**: If you have Supabase Edge Functions, they need to be deployed separately.

5. **Environment Variables**: Remember to update all environment variables in your application and any CI/CD pipelines.

## Support

If you encounter any issues during migration:
1. Check Supabase logs in the dashboard
2. Verify all connection strings are correct
3. Ensure all required extensions are enabled in the new database
4. Review RLS policies are properly configured

## Backup Date
Generated: ${new Date().toISOString()}