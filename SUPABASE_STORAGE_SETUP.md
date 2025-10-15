# Supabase Storage Buckets Setup Guide

## Overview
This guide will help you create all necessary storage buckets for the Mari Gunting app.

## Storage Buckets Overview

| Bucket Name | Purpose | Size Limit | Public |
|------------|---------|------------|--------|
| `barber-documents` | IC photos, selfies, certificates | 10MB | Yes |
| `barber-portfolio` | Portfolio/work showcase images | 10MB | Yes |
| `barbershop-images` | Logos and cover images | 10MB | Yes |
| `barbershop-documents` | SSM docs, business licenses | 10MB | Yes |
| `avatars` | User profile pictures | 5MB | Yes |
| `portfolios` | Legacy portfolio bucket | 10MB | Yes |
| `barbershops` | Legacy barbershop bucket | 10MB | Yes |

## Setup Methods

### Method 1: Using SQL Migration (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Copy the contents of `supabase/migrations/20250112_create_storage_buckets.sql`
   - Paste into the SQL Editor
   - Click "Run" or press `Cmd+Enter`

4. **Verify Success**
   - You should see a message: "Created 7 storage buckets successfully"
   - Go to "Storage" in the sidebar to confirm buckets are visible

### Method 2: Manual Creation via UI

If you prefer to create buckets manually:

1. **Navigate to Storage**
   - Open Supabase Dashboard
   - Click "Storage" in the left sidebar

2. **Create Each Bucket**
   For each bucket in the table above:
   
   a. Click "New Bucket"
   
   b. Fill in the details:
      - **Name**: Use the exact name from the table
      - **Public bucket**: Check this box (all our buckets are public)
      - **File size limit**: Set according to the table
      - **Allowed MIME types**: 
        - For image buckets: `image/jpeg, image/jpg, image/png, image/webp`
        - For document buckets: Add `application/pdf` to the above list
   
   c. Click "Create Bucket"

3. **Set Up Policies**
   For each bucket:
   
   a. Click on the bucket name
   
   b. Go to "Policies" tab
   
   c. Create these 4 policies:
   
   **Policy 1: Upload (INSERT)**
   ```sql
   -- For user-specific buckets (avatars, barber-*, barbershop-*)
   CREATE POLICY "Users can upload their own files"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'BUCKET_NAME' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   
   -- For shared buckets (barbershops)
   CREATE POLICY "Users can upload files"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'BUCKET_NAME');
   ```
   
   **Policy 2: Update**
   ```sql
   CREATE POLICY "Users can update their own files"
   ON storage.objects FOR UPDATE
   TO authenticated
   USING (
     bucket_id = 'BUCKET_NAME' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```
   
   **Policy 3: Delete**
   ```sql
   CREATE POLICY "Users can delete their own files"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'BUCKET_NAME' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```
   
   **Policy 4: Select (View)**
   ```sql
   CREATE POLICY "Anyone can view files"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'BUCKET_NAME');
   ```

## Verification

After setup, verify that uploads work:

1. **Test with the App**
   - Clear the app cache: `npx expo start --clear`
   - Try uploading an image through the onboarding flow
   - Check console logs for "✅ Upload successful"

2. **Check Supabase Dashboard**
   - Go to Storage > Select a bucket
   - You should see folders created with user IDs
   - Files should be visible and accessible

3. **Test Public URLs**
   - Copy a file URL from the logs
   - Paste it in your browser
   - The image should load successfully

## Troubleshooting

### Error: "Bucket not found"
- **Solution**: Run the SQL migration or create the missing bucket manually

### Error: "Permission denied"
- **Solution**: Check that policies are properly set up for the bucket

### Error: "File size limit exceeded"
- **Solution**: Ensure file size limits are set correctly (10MB for most buckets)

### Files not uploading
- **Solution**: 
  1. Check that the bucket is marked as "Public"
  2. Verify RLS policies are enabled
  3. Check network console for detailed error messages

## Security Notes

1. **Public Buckets**: All buckets are public so images can be served directly via CDN URLs
2. **User Isolation**: Policies ensure users can only modify their own files (in their UID folder)
3. **File Size Limits**: Limits prevent abuse and excessive storage costs
4. **MIME Type Restrictions**: Only allowed file types can be uploaded

## Folder Structure

Files are organized by user ID:
```
barber-portfolio/
├── 8ba10c58-64be-41ba-9086-6935d524d617/
│   ├── portfolio_1760257273227.jpg
│   ├── portfolio_1760257285123.jpg
│   └── ...
└── another-user-id/
    └── ...
```

## Next Steps

After creating the buckets:

1. ✅ Clear app cache and restart: `npx expo start --clear`
2. ✅ Test image uploads through the app
3. ✅ Monitor Supabase Storage dashboard for uploaded files
4. ✅ Check that public URLs are accessible
5. ✅ Test on both simulator and physical device

## Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Policies Guide](https://supabase.com/docs/guides/storage/security/access-control)
- [File Upload Best Practices](https://supabase.com/docs/guides/storage/uploads)
