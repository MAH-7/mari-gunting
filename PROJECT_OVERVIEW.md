# Mari Gunting - Production System Overview

## 🎯 Project Description
Mari Gunting is a comprehensive on-demand barbershop booking platform operating in Malaysia. It connects customers with freelance barbers and barbershops for both in-shop and home service appointments.

## 📱 System Components

### 1. Customer App (`apps/customer/`)
- **Purpose**: Mobile app for customers to book barber services
- **Tech Stack**: React Native (Expo)
- **Key Features**:
  - Browse nearby barbers/barbershops
  - Book appointments (home service or in-shop)
  - Real-time tracking of barber location
  - Payment processing
  - Reviews and ratings
  - Loyalty points and vouchers

### 2. Partner App (`apps/partner/`)
- **Purpose**: Mobile app for barbers and barbershop owners
- **Tech Stack**: React Native (Expo)
- **Key Features**:
  - Manage bookings
  - Set availability and service radius
  - Track earnings and payouts
  - Portfolio management
  - Onboarding and verification

### 3. Shared Packages (`packages/shared/`)
- **Purpose**: Reusable code between apps
- **Contains**:
  - Supabase client configuration
  - API services
  - Common components
  - Type definitions
  - Authentication logic

## 🗄️ Database Architecture

### Core Tables (29 total)
**User Management**:
- `profiles` - All user profiles (customers, barbers, barbershop owners)
- `barbers` - Barber-specific data
- `barbershops` - Barbershop information

**Booking System**:
- `bookings` - All appointment records
- `services` - Available services
- `booking_vouchers` - Applied discounts

**Payment & Rewards**:
- `payments` - Payment records
- `payouts` - Barber/shop earnings
- `customer_credits` - Wallet system
- `credit_transactions` - Credit history
- `user_points` - Loyalty points
- `points_transactions` - Points history
- `vouchers` - Available vouchers
- `user_vouchers` - Redeemed vouchers

**Reviews & Communication**:
- `reviews` - Customer reviews
- `messages` - In-app messaging
- `notifications` - Push notifications

**Location & Tracking**:
- `customer_addresses` - Saved addresses
- `active_tracking_sessions` - Live tracking view

**Onboarding**:
- `barber_onboarding` - Barber verification
- `barbershop_onboarding` - Shop verification
- `otp_requests` - Phone verification

## 🔐 Security Features

### RLS (Row Level Security)
- 75 active policies across 23 tables
- Role-based access control
- User data isolation

### User Roles
- `customer` - End users booking services
- `barber` - Freelance service providers
- `barbershop_owner` - Shop managers
- `admin` - System administrators

### Authentication
- Primary: Phone/SMS (Twilio OTP)
- Secondary: Email
- Profile auto-creation on signup

## 📦 Storage Buckets (10)
- `avatars` - Profile pictures
- `barber-portfolios` - Work samples
- `barbershop-media` - Shop images
- `services` - Service images
- `reviews` - Review photos
- `documents` - Verification docs
- Plus 4 more for various media

## 🚀 Key RPC Functions (24)
**Booking Operations**:
- `create_booking` - New appointments
- `update_booking_status` - Status changes
- `cancel_booking` - Cancellations
- `get_customer_bookings` - Booking history

**Location Services**:
- `get_nearby_barbers` - Find barbers
- `search_nearby_barbershops` - Find shops
- `update_service_radius` - Service area
- `update_tracking_metrics` - Live tracking

**Customer Features**:
- `add_customer_address` - Save addresses
- `add_customer_credit` - Wallet top-up
- `redeem_voucher` - Use vouchers
- `submit_review` - Rate services

## 🏗️ Infrastructure

### Current Production
- **Provider**: Supabase
- **Region**: Southeast Asia (Singapore)
- **Project**: mari-gunting-production
- **Database**: PostgreSQL with PostGIS
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth + Twilio

### Technology Stack
- **Frontend**: React Native (Expo)
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **Language**: TypeScript
- **State Management**: React Query
- **Maps**: Google Maps API
- **Payments**: (Integration ready)
- **SMS**: Twilio

## 📊 Current Status

### Database
- ✅ 29 tables fully structured
- ✅ 24 RPC functions operational
- ✅ 19 triggers active
- ✅ 103 indexes for performance
- ✅ 75 RLS policies enforced
- ✅ 2 views for reporting

### Apps
- ✅ Customer app functional
- ✅ Partner app functional
- ✅ Real-time features working
- ✅ Location tracking operational

## 🔄 Backup Status
- **Date**: October 18, 2025
- **Location**: `/supabase-backup/`
- **Coverage**: 100% schema, 0% data
- **Ready for**: Migration to new Supabase account

## 📝 Important Notes

1. **IPv6 Only**: Current database requires IPv6 or Session Pooler
2. **No Production Data**: Schema exported without customer data
3. **Active Production**: System is live with real users
4. **Migration Ready**: Complete backup available for account transfer

## 🎬 Next Steps

1. **For Development**:
   - Set up local Supabase instance
   - Import schema from backup
   - Seed test data

2. **For Migration**:
   - Create new Supabase project
   - Run migration scripts in order
   - Update environment variables
   - Test all endpoints

3. **For New Features**:
   - Check existing RPC functions first
   - Follow established patterns
   - Maintain RLS policies
   - Update TypeScript types

## 📞 Contact & Support
- **Environment**: Production
- **Critical Tables**: bookings, payments, profiles
- **Monitoring**: Check Supabase dashboard
- **Backups**: Daily automated + this manual export

---
*This is a PRODUCTION system. All changes should be tested in development first.*