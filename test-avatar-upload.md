# Avatar Upload Issue - Debugging Steps

## Issue: Avatar upload not working, no image in Supabase bucket

## Check 1: Does the 'avatars' bucket exist?
1. Go to Supabase Dashboard
2. Storage → Buckets
3. Look for `avatars` bucket
4. If it doesn't exist → **CREATE IT**

## Check 2: Bucket policies (RLS)
The `avatars` bucket needs these policies:

### INSERT Policy (allow users to upload):
```sql
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### SELECT Policy (allow public read):
```sql
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### UPDATE Policy (allow users to update their own):
```sql
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### DELETE Policy (allow users to delete their own):
```sql
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Check 3: Bucket Settings
- Make bucket **PUBLIC** (so images can be accessed via URL)
- File size limit: at least 5MB
- Allowed MIME types: `image/*`

## Quick Fix:
Run this in Supabase SQL Editor to create bucket and policies:

```sql
-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Add policies
CREATE POLICY IF NOT EXISTS "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY IF NOT EXISTS "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

After running this, try uploading avatar again!
