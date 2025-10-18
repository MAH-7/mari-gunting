# Mari Gunting Database Schema Documentation

## Database Overview
- **Total Tables**: 29
- **Custom Types**: 6 ENUMs
- **Views**: 2
- **RPC Functions**: 24
- **Triggers**: 19
- **Indexes**: 103
- **RLS Policies**: 75

## 🔑 Core Entity Relationships

```
USERS (profiles)
  ├── CUSTOMERS
  │   ├── bookings
  │   ├── reviews
  │   ├── customer_addresses
  │   ├── customer_credits
  │   ├── favorites
  │   └── user_vouchers
  │
  ├── BARBERS (barbers table)
  │   ├── services
  │   ├── bookings (as provider)
  │   ├── reviews (received)
  │   └── payouts
  │
  └── BARBERSHOP_OWNERS
      ├── barbershops
      ├── services
      └── payouts
```

## 📊 Table Definitions

### 1. User Management Tables

#### `profiles`
Primary user table for all user types.
- **Primary Key**: `id` (UUID) - Links to Supabase Auth
- **Unique**: `phone_number`
- **Key Fields**:
  - `role` (ENUM: customer, barber, barbershop_owner, admin)
  - `full_name`, `email`, `phone_number`
  - `avatar_url` - Storage reference
  - `location` (PostGIS Geography)
  - `is_online`, `is_active`
  - `points_balance` - Loyalty points
  - `phone_verified`, `email_verified`

#### `barbers`
Extended profile for barber users.
- **Primary Key**: `id` (UUID)
- **Foreign Key**: `user_id` → profiles(id)
- **Key Fields**:
  - `verification_status` (ENUM)
  - `service_radius_km` - Service area
  - `rating`, `total_reviews`
  - `completed_bookings`, `total_bookings`
  - `is_available`, `is_verified`
  - `portfolio_images` (Text[])
  - `specializations` (Text[])

#### `barbershops`
Barbershop business entities.
- **Primary Key**: `id` (UUID)
- **Foreign Key**: `owner_id` → profiles(id)
- **Key Fields**:
  - `name`, `description`
  - `location` (PostGIS Geography)
  - `address_line1`, `city`, `state`
  - `rating`, `total_reviews`
  - `operating_hours` (JSONB)
  - `verification_status`

### 2. Booking System Tables

#### `bookings`
Central booking records.
- **Primary Key**: `id` (UUID)
- **Unique**: `booking_number`
- **Foreign Keys**:
  - `customer_id` → profiles(id)
  - `barber_id` → barbers(id)
  - `barbershop_id` → barbershops(id)
- **Key Fields**:
  - `status` (ENUM: pending, accepted, completed, etc.)
  - `services` (JSONB) - Service details
  - `scheduled_datetime` (TIMESTAMPTZ)
  - `service_type` (home_service, in_shop)
  - `total_price`, `subtotal`, `service_fee`, `travel_fee`
  - `payment_method`, `payment_status`
  - Location tracking fields

#### `services`
Available services catalog.
- **Primary Key**: `id` (UUID)
- **Foreign Keys**:
  - `barber_id` → barbers(id)
  - `barbershop_id` → barbershops(id)
- **Key Fields**:
  - `name`, `description`
  - `price`, `duration_minutes`
  - `category`, `is_active`

### 3. Payment & Finance Tables

#### `payments`
Payment transaction records.
- **Primary Key**: `id` (UUID)
- **Foreign Keys**:
  - `booking_id` → bookings(id)
  - `customer_id` → profiles(id)
- **Key Fields**:
  - `amount`, `payment_method`
  - `payment_status` (ENUM)
  - `transaction_id`

#### `customer_credits`
Customer wallet balances.
- **Primary Key**: `id` (UUID)
- **Unique**: `user_id`
- **Foreign Key**: `user_id` → profiles(id)
- **Key Fields**:
  - `balance` (DECIMAL)
  - `total_earned`, `total_spent`

#### `credit_transactions`
Credit transaction history.
- **Primary Key**: `id` (UUID)
- **Foreign Keys**:
  - `user_id` → profiles(id)
  - `booking_id` → bookings(id)
- **Key Fields**:
  - `type` (add, deduct, refund)
  - `amount`, `balance_after`
  - `source`, `description`

### 4. Reviews & Ratings

#### `reviews`
Customer reviews for services.
- **Primary Key**: `id` (UUID)
- **Unique**: `booking_id`
- **Foreign Keys**:
  - `booking_id` → bookings(id)
  - `customer_id` → profiles(id)
  - `barber_id` → barbers(id)
  - `barbershop_id` → barbershops(id)
- **Key Fields**:
  - `rating` (1-5)
  - `comment`, `images` (Text[])
  - `barber_response`
  - `is_verified`, `is_visible`

### 5. Rewards & Loyalty

#### `vouchers`
Available voucher templates.
- **Primary Key**: `id` (UUID)
- **Unique**: `code`
- **Key Fields**:
  - `title`, `description`
  - `type` (percentage, fixed)
  - `value`, `min_spend`
  - `points_cost`
  - `valid_until`, `is_active`

#### `user_vouchers`
Redeemed vouchers by users.
- **Primary Key**: `id` (UUID)
- **Foreign Keys**:
  - `user_id` → profiles(id)
  - `voucher_id` → vouchers(id)
  - `used_for_booking_id` → bookings(id)
- **Key Fields**:
  - `status` (active, used, expired)
  - `used_at`, `points_spent`

#### `points_transactions`
Points earning/redemption history.
- **Primary Key**: `id` (UUID)
- **Foreign Keys**:
  - `user_id` → profiles(id)
  - `booking_id` → bookings(id)
  - `voucher_id` → vouchers(id)
- **Key Fields**:
  - `type` (earn, redeem, bonus, expire)
  - `amount`, `balance_after`

### 6. Location & Address

#### `customer_addresses`
Saved customer addresses.
- **Primary Key**: `id` (UUID)
- **Foreign Key**: `user_id` → profiles(id)
- **Key Fields**:
  - `label`, `address_line1`, `address_line2`
  - `city`, `state`, `postal_code`
  - `location` (PostGIS Geography)
  - `is_default`, `last_used_at`

### 7. Communication

#### `notifications`
Push notification records.
- **Primary Key**: `id` (UUID)
- **Foreign Key**: `user_id` → profiles(id)
- **Key Fields**:
  - `type` (ENUM)
  - `title`, `message`
  - `is_read`, `read_at`

#### `messages`
In-app messaging.
- **Primary Key**: `id` (UUID)
- **Foreign Keys**:
  - `sender_id` → profiles(id)
  - `receiver_id` → profiles(id)
  - `booking_id` → bookings(id)
- **Key Fields**:
  - `message`, `is_read`

### 8. Onboarding & Verification

#### `barber_onboarding`
Barber application tracking.
- **Primary Key**: `id` (UUID)
- **Unique**: `user_id`
- **Foreign Key**: `user_id` → profiles(id)
- **Key Fields**:
  - `status` (pending, approved, rejected)
  - All verification documents
  - `submitted_at`, `reviewed_at`

#### `otp_requests`
OTP verification tracking.
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `phone_number`
  - `otp_code`, `is_verified`
  - `expires_at`

## 🔧 Custom Types (ENUMs)

```sql
booking_status: pending | accepted | on_the_way | arrived | confirmed | 
                in_progress | completed | cancelled | rejected | no_show

payment_status: pending | processing | completed | failed | refunded | cancelled

payment_method: cash | card | fpx | ewallet_tng | ewallet_grab | 
                ewallet_boost | ewallet_shopee

user_role: customer | barber | barbershop_owner | admin

verification_status: unverified | pending | verified | rejected

notification_type: booking | payment | review | promotion | system | chat
```

## 📈 Database Views

### `active_tracking_sessions`
Real-time view of ongoing bookings with tracking.
- Joins: bookings ↔ profiles
- Filters: Active statuses with tracking enabled
- Calculates: Time since last update, ETA

### `user_booking_stats`
Aggregated booking statistics per customer.
- Groups by: customer_id
- Calculates: Total/completed/cancelled bookings, average rating

## 🔄 Key Relationships

### One-to-Many
- profiles → bookings (as customer)
- barbers → bookings (as provider)
- barbershops → services
- bookings → reviews (1:1 actually)
- profiles → customer_addresses

### Many-to-Many (via junction)
- users ↔ vouchers (via user_vouchers)
- bookings ↔ vouchers (via booking_vouchers)

## 🚀 Performance Optimizations

### Critical Indexes
- Location-based (GIST): profiles, barbershops, customer_addresses
- Status filtering: bookings, reviews
- User lookups: All foreign key references
- Time-based: created_at, updated_at fields

### Triggers
- Auto-update `updated_at` timestamps
- Calculate booking distances
- Update barber ratings on new reviews
- Award points on booking completion
- Auto-credit on booking rejection

## 📝 Migration Order

When recreating database:
1. Extensions (postgis, uuid-ossp, etc.)
2. Custom types (ENUMs)
3. Tables (in dependency order)
4. Indexes
5. Foreign keys
6. Views
7. Functions
8. Triggers
9. RLS policies

## ⚠️ Critical Considerations

1. **PostGIS Required**: Location features depend on PostGIS
2. **UUID Primary Keys**: All tables use UUID, not serial
3. **RLS Enforced**: 23 tables have RLS enabled
4. **Soft Deletes**: Most entities use `is_active` flag
5. **Timezone**: All timestamps are TIMESTAMPTZ (with timezone)

---
*Last Updated: October 18, 2025 - Production Database*