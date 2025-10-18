# Mari Gunting API Documentation

## 🔐 Authentication
All API calls require Supabase authentication token in headers:
```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

## 📍 Core RPC Functions

### User & Profile Management

#### `get_user_profile`
Fetch complete user profile with role-specific data.
```typescript
const { data } = await supabase.rpc('get_user_profile', {
  user_id: 'uuid' // optional, defaults to current user
})
```
**Returns**: Complete profile including barber/barbershop data if applicable

#### `update_user_location`
Update user's current location for nearby searches.
```typescript
await supabase.rpc('update_user_location', {
  p_latitude: number,
  p_longitude: number
})
```

#### `check_phone_exists`
Verify if phone number is already registered.
```typescript
const { data: exists } = await supabase.rpc('check_phone_exists', {
  phone: '+60123456789'
})
```

### Barber Discovery

#### `search_nearby_barbers`
Find barbers within radius with filters.
```typescript
const { data } = await supabase.rpc('search_nearby_barbers', {
  p_latitude: number,
  p_longitude: number,
  p_radius_km: 10, // default
  p_service_type: 'home_service' | 'in_shop' | null,
  p_min_rating: 0,
  p_max_price: null,
  p_is_available: true,
  p_search_term: null
})
```
**Returns**: Array of barbers with distance, rating, services

#### `get_barber_details`
Get complete barber profile with stats.
```typescript
const { data } = await supabase.rpc('get_barber_details', {
  barber_id: 'uuid'
})
```

### Booking Management

#### `create_booking`
Create new booking with validation.
```typescript
const { data } = await supabase.rpc('create_booking', {
  p_barber_id: 'uuid',
  p_barbershop_id: 'uuid' | null,
  p_services: [
    {
      service_id: 'uuid',
      name: 'Haircut',
      price: 25.00,
      duration_minutes: 30
    }
  ],
  p_scheduled_datetime: '2025-10-18T10:00:00Z',
  p_service_type: 'home_service',
  p_customer_location: { lat, lng },
  p_customer_address: 'string',
  p_notes: 'string' | null,
  p_payment_method: 'cash'
})
```
**Returns**: Booking ID and booking number

#### `update_booking_status`
Update booking status with validation.
```typescript
await supabase.rpc('update_booking_status', {
  p_booking_id: 'uuid',
  p_new_status: 'accepted' | 'rejected' | 'completed' | etc,
  p_rejection_reason: 'string' | null,
  p_completed_services: [...] | null
})
```

#### `get_user_bookings`
Fetch user's booking history.
```typescript
const { data } = await supabase.rpc('get_user_bookings', {
  p_user_id: 'uuid' | null, // defaults to current
  p_role: 'customer' | 'barber',
  p_status_filter: ['pending', 'accepted'] | null,
  p_limit: 20,
  p_offset: 0
})
```

#### `get_booking_details`
Get complete booking information.
```typescript
const { data } = await supabase.rpc('get_booking_details', {
  p_booking_id: 'uuid'
})
```

### Real-time Tracking

#### `start_tracking_session`
Initialize GPS tracking for booking.
```typescript
await supabase.rpc('start_tracking_session', {
  p_booking_id: 'uuid'
})
```

#### `update_barber_tracking`
Update barber location during service.
```typescript
await supabase.rpc('update_barber_tracking', {
  p_booking_id: 'uuid',
  p_latitude: number,
  p_longitude: number,
  p_heading: number | null,
  p_speed: number | null
})
```

#### `get_active_tracking`
Get real-time tracking data.
```typescript
const { data } = await supabase.rpc('get_active_tracking', {
  p_booking_id: 'uuid'
})
```

### Reviews & Ratings

#### `submit_review`
Submit review for completed booking.
```typescript
await supabase.rpc('submit_review', {
  p_booking_id: 'uuid',
  p_rating: 1-5,
  p_comment: 'string' | null,
  p_images: ['url1', 'url2'] | null
})
```

#### `get_barber_reviews`
Fetch barber's reviews with pagination.
```typescript
const { data } = await supabase.rpc('get_barber_reviews', {
  p_barber_id: 'uuid',
  p_limit: 10,
  p_offset: 0
})
```

### Points & Rewards

#### `get_user_points_balance`
Check current points balance.
```typescript
const { data: balance } = await supabase.rpc('get_user_points_balance', {
  p_user_id: 'uuid' | null
})
```

#### `redeem_voucher`
Exchange points for voucher.
```typescript
const { data } = await supabase.rpc('redeem_voucher', {
  p_voucher_id: 'uuid'
})
```

#### `apply_voucher_to_booking`
Apply voucher discount to booking.
```typescript
await supabase.rpc('apply_voucher_to_booking', {
  p_booking_id: 'uuid',
  p_user_voucher_id: 'uuid'
})
```

### Credits & Wallet

#### `get_credit_balance`
Check wallet balance.
```typescript
const { data: balance } = await supabase.rpc('get_credit_balance', {
  p_user_id: 'uuid' | null
})
```

#### `add_credits`
Add credits to wallet (admin only).
```typescript
await supabase.rpc('add_credits', {
  p_user_id: 'uuid',
  p_amount: 100.00,
  p_source: 'topup',
  p_description: 'Manual top-up'
})
```

### Analytics & Stats

#### `get_barber_analytics`
Get barber performance metrics.
```typescript
const { data } = await supabase.rpc('get_barber_analytics', {
  p_barber_id: 'uuid',
  p_start_date: '2025-10-01',
  p_end_date: '2025-10-31'
})
```
**Returns**: Earnings, bookings count, ratings, popular services

#### `get_booking_stats`
Get booking statistics for user.
```typescript
const { data } = await supabase.rpc('get_booking_stats', {
  p_user_id: 'uuid' | null,
  p_role: 'customer' | 'barber'
})
```

## 🔄 Realtime Subscriptions

### Booking Status Updates
```typescript
supabase
  .channel('booking-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'bookings',
    filter: `customer_id=eq.${userId}`
  }, payload => {
    console.log('Booking updated:', payload.new)
  })
  .subscribe()
```

### Live Tracking
```typescript
supabase
  .channel('tracking')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tracking_sessions',
    filter: `booking_id=eq.${bookingId}`
  }, payload => {
    console.log('Location update:', payload.new)
  })
  .subscribe()
```

### Chat Messages
```typescript
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `receiver_id=eq.${userId}`
  }, payload => {
    console.log('New message:', payload.new)
  })
  .subscribe()
```

## 🗄️ Storage Buckets

### Profile Images
```typescript
// Upload
const { data } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file)

// Get URL
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.jpg`)
```

### Barber Portfolios
```typescript
await supabase.storage
  .from('barber-portfolios')
  .upload(`${barberId}/${fileName}`, file)
```

### Review Images
```typescript
await supabase.storage
  .from('review-images')
  .upload(`${reviewId}/${fileName}`, file)
```

## 🔒 Security Headers

Always include:
```typescript
const headers = {
  'Authorization': `Bearer ${supabaseAnonKey}`,
  'apikey': supabaseAnonKey,
  'Content-Type': 'application/json'
}
```

## ⚠️ Error Codes

| Code | Description |
|------|-------------|
| PGRST116 | RPC function not found |
| PGRST301 | Row-level security violation |
| 23505 | Unique constraint violation |
| 23503 | Foreign key violation |
| P0001 | Custom function error |
| 42883 | Function does not exist |
| 42P01 | Table does not exist |

## 📱 Mobile SDK Usage

### Initialize Client
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)
```

### Auth Flow
```typescript
// Sign up
const { user } = await supabase.auth.signUp({
  phone: '+60123456789',
  password: 'password'
})

// Sign in
const { user } = await supabase.auth.signInWithPassword({
  phone: '+60123456789',
  password: 'password'
})

// OTP verification
await supabase.auth.verifyOtp({
  phone: '+60123456789',
  token: '123456'
})
```

## 🔄 Pagination Pattern

All list endpoints support:
```typescript
{
  p_limit: 20,    // items per page
  p_offset: 0,    // skip items
  p_sort_by: 'created_at',
  p_sort_order: 'desc'
}
```

## 📊 Response Format

Success:
```json
{
  "data": {...},
  "error": null
}
```

Error:
```json
{
  "data": null,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

---
*Last Updated: October 18, 2025*