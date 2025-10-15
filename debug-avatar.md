# Debug Avatar Issue

## Check in Supabase Dashboard:

1. Go to Supabase Dashboard → Table Editor
2. Open `profiles` table
3. Find your user row
4. Check the `avatar_url` column - what value does it have?

## Check in Metro/Expo logs:

Look for these logs:
- `[barberService] Successfully fetched barber profile`
- `[EditProfile] 🖼️ Avatar URL:`

## Common Issues:

### Issue 1: Avatar URL is NULL in database
**Solution**: The avatar was never uploaded or saved to the profile

### Issue 2: Avatar URL exists but image won't display
**Possible causes**:
- Invalid URL format
- CORS issue
- Image file doesn't exist at that URL
- Wrong Image component implementation

### Issue 3: Image picker doesn't open
**Possible causes**:
- Permissions not granted
- Image picker library issue

---

## Tell me:
1. What does the console show for avatar URL?
2. Does the camera button work (opens image picker)?
3. Any error messages in console?
