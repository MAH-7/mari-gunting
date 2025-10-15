# 📋 Setup Checklist - Image Upload Fix

## Part 1: Code Fixes ✅ (Already Done!)

- ✅ Fixed upload function parameter passing
- ✅ Added URI validation
- ✅ Updated deprecated ImagePicker API
- ✅ Added simulator detection for camera
- ✅ Installed expo-device package
- ✅ Added better error handling and logging

## Part 2: Supabase Configuration ⏳ (You Need To Do This)

### Quick Setup (2 minutes):

1. **Open Supabase Dashboard**
   - [ ] Go to https://app.supabase.com
   - [ ] Select your Mari Gunting project

2. **Run SQL Migration**
   - [ ] Click "SQL Editor" in left sidebar
   - [ ] Click "New Query" button
   - [ ] Open file: `supabase/migrations/20250112_create_storage_buckets.sql`
   - [ ] Copy entire file contents
   - [ ] Paste into SQL Editor
   - [ ] Press `Cmd+Enter` or click "Run"
   - [ ] Wait for success message: "Created 7 storage buckets successfully"

3. **Verify Buckets Created**
   - [ ] Click "Storage" in left sidebar
   - [ ] Confirm you see these 7 buckets:
     - [ ] barber-documents
     - [ ] barber-portfolio ⭐ (This was missing!)
     - [ ] barbershop-images
     - [ ] barbershop-documents
     - [ ] avatars
     - [ ] portfolios
     - [ ] barbershops

## Part 3: Testing ⏳

### Test on Simulator:
- [ ] Clear cache: `npx expo start --clear`
- [ ] Navigate to onboarding/eKYC screen
- [ ] Test "Choose from Gallery" button (should work)
- [ ] Test "Take Photo" button (should show helpful message)
- [ ] Upload an image and check logs for "✅ Upload successful"
- [ ] Verify image URL in logs is accessible

### Test on Physical Device (Optional but Recommended):
- [ ] Scan QR code with physical device
- [ ] Test "Take Photo" with real camera
- [ ] Verify upload completes
- [ ] Check image displays correctly

## Part 4: Verification ⏳

### In Supabase Dashboard:
- [ ] Go to Storage > barber-portfolio
- [ ] You should see folder with your user ID
- [ ] Uploaded images should be visible
- [ ] Click image to verify it's accessible

### In App Logs:
Look for these log messages:
```
📸 Image selected: ...
📤 Uploading image: ...
✅ Upload successful: https://...
```

## 🎉 Done!

When all checkboxes are ✅, your image upload is fully working!

## 📚 Reference Documents

- `STORAGE_QUICK_SETUP.md` - Quick 2-minute setup guide
- `SUPABASE_STORAGE_SETUP.md` - Detailed setup instructions
- `COMPLETE_FIX_SUMMARY.md` - Full overview of all fixes
- `apps/partner/FIXES_APPLIED.md` - Technical code changes

## 🆘 Need Help?

If something doesn't work:
1. Check the specific error message in logs
2. Review `SUPABASE_STORAGE_SETUP.md` troubleshooting section
3. Verify all checkboxes above are completed
