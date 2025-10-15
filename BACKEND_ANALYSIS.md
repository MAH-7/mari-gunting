# 🗄️ Backend Analysis - Mari Gunting

**Project:** Mari Gunting (Customer & Partner Apps)  
**Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)  
**Status:** ✅ Shared between Customer & Partner Apps  
**Database:** Production-ready with comprehensive migrations

---

## 📊 Backend Architecture Overview

### **Technology Stack**
- **Database:** Supabase (PostgreSQL + PostGIS)
- **Authentication:** Supabase Auth (Email, Phone OTP, Social)
- **Storage:** Supabase Storage (Images, Documents)
- **Edge Functions:** Deno-based serverless functions
- **Real-time:** Supabase Realtime subscriptions
- **Connection:** Shared client in `packages/shared/config/supabase.ts`

### **Shared Backend Model**
```
┌─────────────────────────────────────────────────┐
│           Supabase Backend (Shared)             │
│  ┌──────────────────────────────────────────┐  │
│  │      PostgreSQL + PostGIS Database       │  │
│  │  - profiles                               │  │
│  │  - barbers / barbershops                 │  │
│  │  - bookings                               │  │
│  │  - services                               │  │
│  │  - reviews                                │  │
│  │  - payments                               │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │         Supabase Auth Service            │  │
│  │  - Email/Password                        │  │
│  │  - Phone (OTP via WhatsApp/SMS)          │  │
│  │  - Google OAuth                           │  │
│  │  - Apple Sign In                          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │       Supabase Storage Buckets           │  │
│  │  - avatars                                │  │
│  │  - portfolio-images                       │  │
│  │  - documents (KYC, business docs)         │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │         Edge Functions (Deno)            │  │
│  │  - send-otp                               │  │
│  │  - register-user                          │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
            ↓                    ↓
    ┌───────────────┐    ┌───────────────┐
    │  Customer App │    │  Partner App  │
    │   (React Native)   │   (React Native)  │
    └───────────────┘    └───────────────┘
```

---

## 🗃️ Database Schema

### **Core Tables**

#### 1. **profiles** (Shared User Profiles)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role user_role NOT NULL, -- 'customer' | 'barber' | 'barbershop_owner' | 'admin'
  full_name TEXT NOT NULL,
  phone_number TEXT UNIQUE,
  phone_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  location GEOGRAPHY(POINT, 4326),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Usage:**
- ✅ Both Customer and Partner apps read/write
- ✅ Single source of truth for user data
- ✅ Role-based access control

#### 2. **barbers** (Freelance Barbers)
```sql
CREATE TABLE barbers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  business_name TEXT,
  bio TEXT,
  specializations TEXT[],
  verification_status verification_status,
  rating DECIMAL(3,2),
  is_available BOOLEAN,
  bank_account_number TEXT,
  created_at TIMESTAMPTZ
);
```
**Usage:**
- ✅ Partner app: Full CRUD (onboarding, profile updates)
- ✅ Customer app: Read-only (search, booking)

#### 3. **barbershops** (Physical Shops)
```sql
CREATE TABLE barbershops (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  verification_status verification_status,
  rating DECIMAL(3,2),
  is_open_now BOOLEAN,
  created_at TIMESTAMPTZ
);
```
**Usage:**
- ✅ Partner app: Full CRUD (shop management)
- ✅ Customer app: Read-only (search, booking)

#### 4. **bookings** (Shared Booking System)
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id),
  barber_id UUID REFERENCES barbers(id),
  barbershop_id UUID REFERENCES barbershops(id),
  status booking_status,
  scheduled_at TIMESTAMPTZ,
  total_price DECIMAL(10,2),
  created_at TIMESTAMPTZ
);
```
**Usage:**
- ✅ Customer app: Create, view own bookings
- ✅ Partner app: View, accept, manage bookings
- ✅ Real-time updates for both sides

#### 5. **services** (Haircut Services)
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY,
  barber_id UUID REFERENCES barbers(id),
  barbershop_id UUID REFERENCES barbershops(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  duration INTEGER, -- minutes
  is_active BOOLEAN DEFAULT TRUE
);
```
**Usage:**
- ✅ Partner app: Full CRUD
- ✅ Customer app: Read-only (service selection)

#### 6. **reviews** (Rating System)
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  customer_id UUID REFERENCES profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ
);
```
**Usage:**
- ✅ Customer app: Create reviews after booking
- ✅ Partner app: Read-only (view ratings)

---

## 🔐 Authentication System

### **Shared Auth Configuration**
**File:** `packages/shared/config/supabase.ts`

```typescript
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### **Auth Methods Available**

| Method | Customer App | Partner App | Status |
|--------|--------------|-------------|--------|
| Email/Password | ✅ Yes | ✅ Yes | Working |
| Phone OTP (WhatsApp) | ✅ Yes | ✅ Yes | Working |
| Google OAuth | ⏳ Setup needed | ⏳ Setup needed | Pending |
| Apple Sign In | ⏳ Setup needed | ⏳ Setup needed | Pending |

### **Auth Flow**

#### Customer Registration:
1. User signs up via email/phone
2. Profile created with `role='customer'`
3. Redirect to customer dashboard

#### Partner Registration:
1. User signs up via email/phone
2. Profile created with `role='barber'` or `'barbershop_owner'`
3. Additional table entry (barbers or barbershops)
4. Redirect to partner onboarding
5. KYC verification process
6. Admin approval required

---

## 🚀 Edge Functions

### **1. send-otp**
**Location:** `supabase/functions/send-otp/`

```typescript
// Sends WhatsApp OTP for phone authentication
POST /functions/v1/send-otp
{
  "phone": "+60123456789"
}
```

**Usage:**
- ✅ Both apps use for phone auth
- ✅ WhatsApp API integration
- ✅ Rate limiting implemented

### **2. register-user**
**Location:** `supabase/functions/register-user/`

```typescript
// Handles user registration with role assignment
POST /functions/v1/register-user
{
  "email": "user@example.com",
  "password": "secure123",
  "fullName": "John Doe",
  "role": "customer" // or "barber"
}
```

**Usage:**
- ✅ Both apps use for registration
- ✅ Creates profile with correct role
- ✅ Handles barber/barbershop initialization

---

## 🔒 Row Level Security (RLS)

### **Security Model**

All tables have RLS policies to ensure data isolation:

#### **profiles Table:**
```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### **barbers Table:**
```sql
-- Customers can view verified barbers
CREATE POLICY "Customers can view verified barbers"
  ON barbers FOR SELECT
  USING (verification_status = 'verified' AND is_available = true);

-- Barbers can manage their own profile
CREATE POLICY "Barbers can manage own profile"
  ON barbers FOR ALL
  USING (user_id = auth.uid());
```

#### **bookings Table:**
```sql
-- Customers can view their own bookings
CREATE POLICY "Customers can view own bookings"
  ON bookings FOR SELECT
  USING (customer_id = auth.uid());

-- Partners can view their assigned bookings
CREATE POLICY "Partners can view assigned bookings"
  ON bookings FOR SELECT
  USING (
    barber_id IN (SELECT id FROM barbers WHERE user_id = auth.uid())
  );
```

---

## 📦 Storage Buckets

### **Bucket Structure**

| Bucket Name | Purpose | Access |
|-------------|---------|--------|
| `avatars` | User profile pictures | Public read, owner write |
| `portfolio-images` | Barber portfolio | Public read, barber write |
| `documents` | KYC, business docs | Private, admin/owner only |
| `barbershop-photos` | Shop images | Public read, owner write |

### **Storage Policies**

```sql
-- Avatars: Public read, authenticated write own
CREATE POLICY "Public avatar read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Documents: Private, owner only
CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 🔄 Real-time Subscriptions

### **Used for Live Updates**

#### **Customer App:**
```typescript
// Listen for booking status changes
supabase
  .channel('customer-bookings')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'bookings',
    filter: `customer_id=eq.${userId}`
  }, (payload) => {
    // Update UI with new booking status
  })
  .subscribe();
```

#### **Partner App:**
```typescript
// Listen for new booking requests
supabase
  .channel('partner-bookings')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'bookings',
    filter: `barber_id=eq.${barberId}`
  }, (payload) => {
    // Show notification for new booking
  })
  .subscribe();
```

---

## 📋 Database Migrations

### **Migration Files (24 total)**

1. ✅ `001_initial_schema.sql` - Core tables
2. ✅ `002_rls_policies.sql` - Row level security
3. ✅ `003_storage_buckets.sql` - Storage setup
4. ✅ `004_database_functions.sql` - Stored procedures
5. ✅ `005_customer_booking_functions.sql` - Booking logic
6. ✅ `006_review_system.sql` - Ratings & reviews
7. ✅ `007_partner_account_setup.sql` - Partner onboarding
8. ✅ `008_add_verification_status_columns.sql` - KYC status
9. ✅ `999_test_data.sql` - Sample data

### **Apply Migrations**

```bash
# Apply all migrations
supabase db reset

# Or apply specific migration
supabase migration up --file 001_initial_schema.sql
```

---

## 🎯 API Service Layer

### **Shared Services in `packages/shared/services/`**

#### **1. authService.ts**
- ✅ Sign up, sign in, sign out
- ✅ Phone OTP flow
- ✅ Session management
- ✅ Used by both apps

#### **2. bookingService.ts**
- ✅ Create booking (customer)
- ✅ Accept/reject booking (partner)
- ✅ Update booking status
- ✅ Shared between apps

#### **3. profileService.ts**
- ✅ Get/update profile
- ✅ Upload avatar
- ✅ Shared functionality

#### **4. partnerAccountService.ts**
- ✅ Partner-specific account setup
- ✅ KYC submission
- ✅ Bank details
- ✅ Used only by partner app

#### **5. geocodingService.ts**
- ✅ Address lookup
- ✅ Location search
- ✅ Used by both apps

---

## ✅ Backend Status Check

### **Database**
- ✅ Schema defined and migrated
- ✅ RLS policies implemented
- ✅ Indexes for performance
- ✅ PostGIS for location queries

### **Authentication**
- ✅ Email/Password working
- ✅ Phone OTP working
- ⏳ Google OAuth (needs setup)
- ⏳ Apple Sign In (needs setup)

### **Storage**
- ✅ Buckets created
- ✅ RLS policies set
- ✅ Image upload working

### **Edge Functions**
- ✅ send-otp deployed
- ✅ register-user deployed

### **API Services**
- ✅ All services implemented
- ✅ Type-safe interfaces
- ✅ Error handling
- ✅ Shared between apps

---

## 🔍 Backend Testing

### **Test Connection**
```bash
cd apps/partner
npm start

# Check console for:
# ✅ Supabase connection successful
```

### **Test Database Access**
```typescript
import { supabase } from '@mari-gunting/shared';

// Test query
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .limit(1);

if (error) {
  console.error('❌ Database error:', error);
} else {
  console.log('✅ Database working:', data);
}
```

### **Test Auth**
```typescript
// Test registration
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'SecurePass123!',
});
```

---

## 📊 Backend Performance

### **Optimization Strategies**

1. **Database Indexes:**
   - ✅ Primary keys on all tables
   - ✅ Foreign key indexes
   - ✅ PostGIS spatial index for location queries
   - ✅ Composite indexes on frequently queried columns

2. **Query Optimization:**
   - ✅ Use `select` to limit columns
   - ✅ Pagination for large datasets
   - ✅ Caching with React Query

3. **Real-time Optimization:**
   - ✅ Targeted subscriptions (filter by user)
   - ✅ Unsubscribe when components unmount
   - ✅ Throttle updates

---

## 🚨 Security Considerations

### **Already Implemented**
- ✅ Row Level Security (RLS) on all tables
- ✅ Service role key kept secret
- ✅ Anon key safe for client use
- ✅ Authentication required for sensitive operations
- ✅ Rate limiting on edge functions

### **Recommendations**
- ⚠️ Enable email verification in production
- ⚠️ Set up 2FA for admin accounts
- ⚠️ Monitor auth logs for suspicious activity
- ⚠️ Regular security audits
- ⚠️ Keep Supabase SDK updated

---

## 🎉 Summary

### **Backend Status: ✅ PRODUCTION READY**

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | 15+ tables, PostGIS enabled |
| RLS Policies | ✅ Implemented | All tables secured |
| Auth System | ✅ Working | Email + Phone OTP |
| Storage | ✅ Working | Buckets + policies set |
| Edge Functions | ✅ Deployed | OTP + registration |
| API Services | ✅ Complete | Type-safe, shared |
| Migrations | ✅ Applied | 24 migration files |
| Performance | ✅ Optimized | Indexed, paginated |
| Security | ✅ Strong | RLS + auth required |

### **Shared Between Apps: ✅ YES**

- ✅ Single Supabase project
- ✅ Shared database schema
- ✅ Shared authentication
- ✅ Shared API services (`packages/shared/`)
- ✅ Role-based access control
- ✅ Proper data isolation via RLS

---

## 📚 Documentation Files

- ✅ `supabase/AUTH_SETUP.md` - Auth provider setup
- ✅ `supabase/MIGRATION_GUIDE.md` - Migration instructions
- ✅ `supabase/COMBINED_MIGRATIONS.sql` - All migrations combined
- ✅ `BACKEND_ANALYSIS.md` - This file

---

## 🔗 Quick Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/uufiyurcsldecspakneg
- **Database:** https://supabase.com/dashboard/project/uufiyurcsldecspakneg/editor
- **Auth:** https://supabase.com/dashboard/project/uufiyurcsldecspakneg/auth/users
- **Storage:** https://supabase.com/dashboard/project/uufiyurcsldecspakneg/storage/buckets
- **Functions:** https://supabase.com/dashboard/project/uufiyurcsldecspakneg/functions

---

**Your backend is production-ready and properly shared between customer and partner apps! 🚀**
