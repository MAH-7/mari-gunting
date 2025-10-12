# Authentication Session Fix - Dev Mode

## Problem

When using the app in development mode, users experienced a "Not authenticated" error when trying to perform authenticated operations like adding an address via RPC functions. This occurred even after successful OTP verification.

### Root Cause

In dev mode, the `verifyOTP` function in `authService.ts` was creating auth users via `supabase.auth.signUp()` but **not guaranteeing** that an authenticated session was established and persisted. The flow was:

1. User enters OTP → `signUp()` creates auth user
2. `signUp()` may or may not create a session (depends on Supabase email confirmation settings)
3. User completes registration
4. User tries to add address → Supabase client has **no auth token** → RPC fails with "Not authenticated"

## Solution

Modified `packages/shared/services/authService.ts` (lines 367-393) to **explicitly sign in** after creating an auth user if no session was automatically created:

```typescript
// CRITICAL: If no session was created, explicitly sign in to establish one
// This ensures subsequent RPC calls have authentication context
if (!signUpData.session) {
  console.log('⚠️ No session created by signUp, signing in explicitly...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    phone: phoneNumber,
    password: tempPassword,
  });
  
  if (signInError) {
    console.error('❌ Failed to sign in after signup:', signInError);
    return {
      success: false,
      error: 'Failed to establish authenticated session',
    };
  }
  
  if (!signInData.session) {
    console.error('❌ No session created after sign in');
    return {
      success: false,
      error: 'Failed to establish authenticated session',
    };
  }
  
  console.log('✅ Authenticated session established:', signInData.session.access_token.substring(0, 20) + '...');
}
```

## How It Works

1. After `signUp()` creates the auth user
2. Check if a session exists in the response
3. If **no session**, explicitly call `signInWithPassword()` with the temporary password
4. Verify the session was created
5. Log success with partial token for debugging

This ensures that:
- The Supabase client has a valid authentication token
- Subsequent API calls (including RPC functions) run with the user's authentication context
- RLS policies can properly enforce permissions based on `auth.uid()`

## Testing Instructions

To verify the fix works:

1. **Start fresh authentication flow**:
   ```bash
   # Close the app completely on your device
   # Reopen it
   ```

2. **Go through OTP login**:
   - Enter phone number
   - Enter OTP code (123456 in dev mode)
   - Watch console logs for:
     ```
     ✅ New auth user created: <user-id>
     ⚠️ No session created by signUp, signing in explicitly...
     ✅ Authenticated session established: <token-prefix>...
     ```

3. **Complete registration**:
   - Fill out user details
   - Save profile

4. **Test authenticated operation**:
   - Navigate to Addresses
   - Add a new address
   - Fill out address form
   - Save address
   - Should succeed without "Not authenticated" error

## Related Files

- `packages/shared/services/authService.ts` - Authentication service with session fix
- `packages/shared/config/supabase.ts` - Supabase client configuration
- `apps/customer/app/verify-otp.tsx` - OTP verification screen
- `supabase/migrations/20250501000002_fix_customer_address_rls.sql` - RLS policy fix for customer_addresses

## Migration Applied

Also applied migration to fix RLS policies:

```sql
-- Update add_customer_address function to use SECURITY INVOKER
-- This makes the function run with caller's privileges, enforcing RLS
CREATE OR REPLACE FUNCTION add_customer_address(...)
RETURNS customer_addresses
LANGUAGE plpgsql
SECURITY INVOKER  -- Key change: runs with caller's permissions
...
```

## Next Steps

1. ✅ Test the complete authentication flow
2. ✅ Verify address creation works
3. Test other authenticated operations (bookings, profile updates, etc.)
4. Monitor logs for any remaining authentication issues
5. Consider implementing similar fix for production OTP flow if needed

## Production Considerations

In production, the real OTP flow uses `supabase.auth.verifyOtp()` which should automatically establish a session. However, if similar issues occur in production:

1. Add similar session verification after `verifyOtp()`
2. Log session status for debugging
3. Consider adding retry logic for session creation
4. Monitor error rates for "Not authenticated" errors

## Development vs Production

- **Dev Mode**: Uses test OTP (123456) and creates auth users directly
- **Production**: Uses real SMS OTP via Twilio and Supabase's built-in OTP verification
- **Both modes** now ensure authenticated sessions are established before allowing user operations
