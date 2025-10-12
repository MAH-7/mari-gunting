# 🗄️ Database Migration Guide

## How to Run Migrations in Supabase

### Method 1: Supabase Dashboard (Recommended for now)

1. **Go to your Supabase Dashboard**
   👉 https://supabase.com/dashboard/project/uufiyurcsldecspakneg

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run Migration 001 - Initial Schema**
   - Copy the entire contents of `migrations/001_initial_schema.sql`
   - Paste into the SQL Editor
   - Click "Run" or press `Cmd/Ctrl + Enter`
   - Wait for completion (should take ~5-10 seconds)
   - ✅ You should see "Success. No rows returned"

4. **Run Migration 002 - RLS Policies**
   - Copy the entire contents of `migrations/002_rls_policies.sql`
   - Paste into the SQL Editor
   - Click "Run"
   - Wait for completion
   - ✅ You should see "Success. No rows returned"

5. **Verify Schema**
   - Click "Table Editor" in the left sidebar
   - You should see all 12 tables:
     - profiles
     - barbers
     - barbershops
     - services
     - bookings
     - reviews
     - payments
     - payouts
     - notifications
     - messages
     - promo_codes
     - favorites

---

### Method 2: Supabase CLI (For later, when you set it up)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref uufiyurcsldecspakneg

# Run migrations
supabase db push
```

---

## 📊 Database Schema Overview

### **12 Tables Created:**

1. **profiles** - User profiles (extends auth.users)
2. **barbers** - Freelance barber profiles
3. **barbershops** - Physical shop locations
4. **services** - Services offered
5. **bookings** - Customer appointments
6. **reviews** - Ratings & reviews
7. **payments** - Payment transactions
8. **payouts** - Barber/shop earnings
9. **notifications** - Push notifications
10. **messages** - In-app chat
11. **promo_codes** - Discount codes
12. **favorites** - User favorites

### **Key Features:**

✅ **PostGIS** enabled for geolocation  
✅ **UUID** for all primary keys  
✅ **ENUMs** for status fields  
✅ **Indexes** for performance  
✅ **Triggers** for auto-updates  
✅ **Functions** for common operations  
✅ **RLS Policies** for security  

---

## 🔐 Security Features

### **Row Level Security (RLS):**
- ✅ Users can only see their own data
- ✅ Public data (barbers, shops) visible to all
- ✅ Booking access controlled by role
- ✅ Review permissions enforced
- ✅ Payment data secured

### **Helper Functions:**
- `is_admin()` - Check if user is admin
- `is_barber()` - Check if user is barber
- `owns_barbershop()` - Check shop ownership

---

## 🧪 Test Your Schema

After running migrations, test with these queries:

### 1. Check all tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 2. Verify RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 3. Check extensions:
```sql
SELECT * FROM pg_extension;
```

### 4. List all ENUMs:
```sql
SELECT typname 
FROM pg_type 
WHERE typtype = 'e';
```

---

## 📝 Next Steps

After migrations are complete:

1. ✅ Create TypeScript types from schema
2. ✅ Set up authentication hooks
3. ✅ Create API service functions
4. ✅ Test CRUD operations
5. ✅ Seed with test data

---

## ⚠️ Troubleshooting

### "Extension postgis does not exist"
PostGIS should be available by default in Supabase. If not:
- Go to Dashboard > Database > Extensions
- Enable PostGIS manually

### "Permission denied"
Make sure you're using the Supabase SQL Editor with your project owner account.

### "Relation already exists"
This means the migration already ran. Either:
- Skip to next migration
- Or drop tables and re-run (⚠️ will delete data!)

---

**Ready to run migrations?** Let me know once completed! ✅
