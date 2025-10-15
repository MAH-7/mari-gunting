# Quick Start: Using Real Barber Data

## ✅ What's Done

Your customer app now uses **REAL Supabase data** for barbers instead of mock data!

## 🎯 What Works Now

- ✅ Barber listings (home screen & barbers screen)
- ✅ Barber search
- ✅ Barber details page
- ✅ Quick Book feature
- ✅ Filters by `is_online` AND `is_available` 

## 🔧 Toggle Between Mock and Real Data

**File:** `packages/shared/services/api.ts`

```typescript
const USE_REAL_DATA = true;  // ← Change this
```

- **`true`** = Use real Supabase data
- **`false`** = Use mock data for testing

## 📋 Database Requirements

Your Supabase database needs these tables with data:

### 1. `profiles` table
```
- id (UUID)
- full_name
- email
- phone_number
- avatar_url
- is_online (boolean) ← IMPORTANT!
- location (geography)
```

### 2. `barbers` table
```
- id (UUID)
- user_id → profiles.id
- bio
- rating
- total_reviews
- completed_bookings
- is_available (boolean) ← IMPORTANT!
- is_verified
- specializations (text[])
- portfolio_images (text[])
```

### 3. `services` table
```
- id (UUID)
- barber_id → barbers.id
- name
- price
- duration_minutes
- is_active (boolean)
```

## 🚀 Testing

### Check if it's working:

1. **Start the app**
2. **Check console logs:**
   - Should see: `📡 Using REAL Supabase data`
   - When fetching: `🔍 Fetching barbers from Supabase...`
   - After success: `✅ Found X barbers`

### No barbers showing?

**Common issues:**
1. No data in database
2. Barbers have `is_available = false` or `is_online = false`
3. No services linked to barbers
4. Supabase credentials not configured

## 🔍 Quick Debug

```bash
# Check Supabase connection
# Look for this in console:
"✅ Supabase connection successful"

# If you see connection errors:
# 1. Check .env file
# 2. Verify EXPO_PUBLIC_SUPABASE_URL
# 3. Verify EXPO_PUBLIC_SUPABASE_ANON_KEY
```

## 📊 Data Flow

```
Customer App → api.getBarbers() → supabaseApi.getBarbers() → Supabase Database
                                                            ↓
                                                     Transform data
                                                            ↓
                                                     Return to app
```

## 🔄 What Still Uses Mock Data

- Barbershops
- Bookings
- Reviews
- Payments

These will be migrated separately.

## 📝 Next Steps

To complete the migration:

1. **Test thoroughly** with real data
2. **Add more barbers** to your database
3. **Verify filters work** (online/available)
4. **Test Quick Book** feature
5. **Check barber details** page displays correctly

## 📚 Full Documentation

For detailed information, see:
- `CUSTOMER_APP_REAL_DATA_IMPLEMENTATION.md` - Complete implementation details
- `BARBER_AVAILABILITY_FILTER_UPDATE.md` - Filtering logic details

---

**Ready to use!** Just make sure your Supabase database has barber data. 🎉
