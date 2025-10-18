# Auth Configuration

## Current Setup (from .env file)

- **Supabase URL**: https://uufiyurcsldecspakneg.supabase.co
- **Anon Key**: Configured in .env
- **Service Role Key**: Configured in .env

## Auth Providers to Configure in New Project

Based on your app code analysis:

### 1. Phone/SMS Authentication (Primary)
- Provider: Twilio
- Used for: OTP login
- Tables: `otp_requests`
- Configure in: Supabase Dashboard > Authentication > Providers > Phone

### 2. Email Authentication
- Used as fallback/additional method
- Configure in: Supabase Dashboard > Authentication > Providers > Email

## Auth Settings to Configure

### User Roles
- customer
- barber
- barbershop_owner
- admin

### RLS Policies
All auth-related RLS policies have been exported in `policies/rls_policies.sql`

### Auth Flow
1. Phone number verification via OTP
2. Profile creation in `profiles` table
3. Role assignment based on user type
4. Additional setup for barbers/barbershops

## Migration Steps

1. In new Supabase project:
   - Enable Phone auth provider
   - Configure Twilio credentials (from your .env)
   - Enable Email auth provider
   - Set up the same JWT expiry and refresh settings

2. After running SQL scripts:
   - Verify auth triggers are created
   - Test OTP flow
   - Verify profile creation trigger

## Important Tables for Auth
- `profiles` - Main user profiles
- `otp_requests` - OTP verification tracking
- `barber_onboarding` - Barber verification
- `barbershop_onboarding` - Barbershop verification

## Environment Variables Needed
```env
TWILIO_ACCOUNT_SID=<your_sid>
TWILIO_AUTH_TOKEN=<your_token>
EXPO_PUBLIC_SUPABASE_URL=<new_project_url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<new_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<new_service_role_key>
```