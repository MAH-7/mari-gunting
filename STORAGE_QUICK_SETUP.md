# Quick Storage Setup - Mari Gunting

## 🚀 Fast Setup (2 minutes)

### Step 1: Open Supabase
1. Go to https://app.supabase.com
2. Select your Mari Gunting project
3. Click "SQL Editor" in sidebar

### Step 2: Run SQL Migration
1. Click "New Query"
2. Copy & paste the entire contents from:
   ```
   supabase/migrations/20250112_create_storage_buckets.sql
   ```
3. Press `Cmd+Enter` or click "Run"
4. Wait for: "Created 7 storage buckets successfully"

### Step 3: Verify
1. Go to "Storage" in sidebar
2. You should see 7 buckets:
   - ✅ barber-documents
   - ✅ barber-portfolio
   - ✅ barbershop-images
   - ✅ barbershop-documents
   - ✅ avatars
   - ✅ portfolios
   - ✅ barbershops

### Step 4: Test
```bash
cd apps/partner
npx expo start --clear
```
Then test image upload in the app.

## ✅ What This Creates

| Bucket | What It Stores |
|--------|----------------|
| `barber-documents` | IC photos, selfies, certificates |
| `barber-portfolio` | Work showcase images |
| `barbershop-images` | Logos, cover images |
| `barbershop-documents` | SSM, business licenses |
| `avatars` | Profile pictures |

## 🔒 Security (Automatic)

- ✅ Users can only upload to their own folder (user ID)
- ✅ Everyone can view public images (for displaying)
- ✅ 10MB file size limit per upload
- ✅ Only images and PDFs allowed

## 🐛 Troubleshooting

**"Bucket not found" error?**
→ Re-run the SQL migration

**Upload still failing?**
→ Check Supabase logs in dashboard under "Logs > Database"

**Need to see detailed guide?**
→ Open `SUPABASE_STORAGE_SETUP.md`

## 📝 Files Created

1. `supabase/migrations/20250112_create_storage_buckets.sql` - SQL migration
2. `SUPABASE_STORAGE_SETUP.md` - Detailed setup guide
3. `apps/partner/FIXES_APPLIED.md` - Code fixes documentation

## ✨ You're Done!

Once you see "Created 7 storage buckets successfully", your storage is ready to use.
