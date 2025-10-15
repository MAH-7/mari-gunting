# Partner Reviews - Live Data Integration

> **Status**: ✅ Complete - Using Supabase live data  
> **Last Updated**: 2025-10-13 18:00 UTC  
> **Screen**: Partner App → Reviews Tab

---

## 🎯 What Was Changed

The Partner app's Reviews screen now fetches **live data from Supabase** instead of using mock data.

### Changes Made:

1. ✅ **Created Reviews Service** (`packages/shared/services/reviewsService.ts`)
   - Fetches reviews from Supabase
   - Supports both **Freelance Barbers** and **Barbershops**
   - Transforms database format to UI-friendly format
   - Calculates review statistics
   - Handles review responses

2. ✅ **Updated Reviews Screen** (`apps/partner/app/(tabs)/reviews.tsx`)
   - Removed mock data
   - Integrated with Supabase via reviews service
   - Auto-detects account type (freelance vs barbershop)
   - Loading states and error handling
   - Pull-to-refresh functionality
   - Real-time response posting

---

## 📊 Features

### Review Display
- ✅ Fetches reviews from Supabase `reviews` table
- ✅ Shows customer name, avatar (initials), rating, comment
- ✅ Displays service name from booking
- ✅ Formatted dates
- ✅ Partner responses (if any)

### Statistics Dashboard
- ✅ Average rating calculation
- ✅ Total reviews count
- ✅ Rating distribution (5⭐ to 1⭐)
- ✅ Response rate percentage
- ✅ Count of reviews needing replies

### Filtering
- ✅ Filter by rating (All, 5⭐, 4⭐, 3⭐, 2⭐, 1⭐)
- ✅ Real-time filter updates

### Response Management
- ✅ Reply to reviews
- ✅ Post response to Supabase
- ✅ Update UI immediately after posting
- ✅ Loading indicator during submission
- ✅ Error handling

---

## 🏗️ Database Schema

### Reviews Table Structure

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  customer_id UUID REFERENCES profiles(id),
  barber_id UUID REFERENCES barbers(id),      -- For freelance barbers
  barbershop_id UUID REFERENCES barbershops(id), -- For barbershops
  
  -- Rating & Content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[],
  
  -- Partner Response
  response TEXT,
  response_at TIMESTAMP WITH TIME ZONE,
  
  -- Moderation
  is_verified BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Relationships

```
reviews
├── bookings (booking details)
│   ├── services (service names)
│   └── profiles (customer info)
├── barber_id (if freelance barber)
└── barbershop_id (if barbershop)
```

---

## 🔧 Service Functions

### `getPartnerReviews(partnerId, accountType)`

Fetches all reviews for a partner (barber or barbershop).

**Parameters:**
- `partnerId` (string) - User ID of the partner
- `accountType` ('freelance' | 'barbershop') - Type of account

**Returns:**
```typescript
PartnerReview[] = [
  {
    id: string,
    customerName: string,
    customerAvatar: string,  // Initials (e.g., "AZ")
    rating: number,          // 1-5
    comment: string | null,
    service: string,         // Service name
    date: string,            // ISO timestamp
    response: {
      text: string,
      date: string
    } | null
  }
]
```

**Query Logic:**
- If `freelance`: Filters by `barber_id = partnerId`
- If `barbershop`: Filters by `barbershop_id = partnerId`
- Only fetches visible reviews (`is_visible = true`)
- Includes customer profile and booking details
- Orders by `created_at DESC` (newest first)

---

### `getReviewStats(reviews)`

Calculates statistics from reviews array.

**Returns:**
```typescript
ReviewStats = {
  total: number,
  avgRating: number,
  distribution: {
    5: number,
    4: number,
    3: number,
    2: number,
    1: number
  },
  responseRate: number  // Percentage (0-100)
}
```

---

### `postReviewResponse(reviewId, responseText)`

Posts a response to a review.

**Parameters:**
- `reviewId` (string) - Review ID
- `responseText` (string) - Response message

**Updates:**
- Sets `response` field in database
- Sets `response_at` to current timestamp
- Updates `updated_at` timestamp

---

## 📱 UI Flow

### Initial Load
```
1. Screen mounts
2. Load account type from AsyncStorage
3. Fetch reviews from Supabase
4. Transform data for UI
5. Calculate statistics
6. Display reviews
```

### Pull to Refresh
```
1. User pulls down
2. Show refresh indicator
3. Re-fetch reviews from Supabase
4. Update UI with new data
5. Hide refresh indicator
```

### Post Response
```
1. User taps "Reply to Review"
2. Modal opens with review preview
3. User types response
4. User taps "Post Reply"
5. Show loading indicator
6. Post to Supabase
7. Update local state
8. Show success message
9. Close modal
```

---

## 🎨 Account Type Handling

The reviews screen automatically adapts to the partner's account type:

### Freelance Barber
- Fetches reviews where `barber_id = currentUser.id`
- Shows reviews from customers who booked individual barber services
- Account type stored in AsyncStorage: `'freelance'`

### Barbershop
- Fetches reviews where `barbershop_id = currentUser.id`
- Shows reviews from customers who visited the shop
- Reviews can be for any staff member at the shop
- Account type stored in AsyncStorage: `'barbershop'`

### Detection Logic
```typescript
// On screen mount
const type = await AsyncStorage.getItem('partnerAccountType');
// type = 'freelance' | 'barbershop'

// Query adjusts automatically
if (type === 'freelance') {
  query.eq('barber_id', partnerId);
} else {
  query.eq('barbershop_id', partnerId);
}
```

---

## 🔍 Data Transformation

### Database Format → UI Format

**Database:**
```json
{
  "id": "uuid",
  "rating": 5,
  "comment": "Great service!",
  "response": "Thank you!",
  "response_at": "2025-01-10T...",
  "created_at": "2025-01-08T...",
  "bookings": {
    "services": [{ "name": "Haircut" }],
    "profiles": {
      "full_name": "John Doe",
      "avatar_url": "https://..."
    }
  }
}
```

**Transformed for UI:**
```json
{
  "id": "uuid",
  "customerName": "John Doe",
  "customerAvatar": "JD",
  "rating": 5,
  "comment": "Great service!",
  "service": "Haircut",
  "date": "2025-01-08T...",
  "response": {
    "text": "Thank you!",
    "date": "2025-01-10T..."
  }
}
```

---

## 🚨 Error Handling

### Network Errors
```typescript
try {
  const data = await getPartnerReviews(partnerId, accountType);
  setReviews(data);
} catch (error) {
  Alert.alert(
    'Error',
    'Failed to load reviews. Please check your connection and try again.'
  );
}
```

### Empty States
- **No reviews at all**: Shows "No reviews yet" message
- **Filtered to 0 results**: Shows "No reviews in this filter"

### Loading States
- Initial load: Shows loading spinner with "Loading reviews..."
- Refresh: Pull-to-refresh indicator
- Posting response: Button shows loading spinner

---

## 🔐 Supabase Configuration

### Environment Variables
```bash
EXPO_PUBLIC_SUPABASE_URL=https://uufiyurcsldecspakneg.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Required Tables
- ✅ `reviews` - Main reviews table
- ✅ `bookings` - Booking details
- ✅ `profiles` - Customer profiles
- ✅ `barbers` - Freelance barber profiles
- ✅ `barbershops` - Barbershop profiles

### Row Level Security (RLS)
Should be configured to:
- Allow partners to read their own reviews
- Allow partners to update `response` field on their reviews
- Prevent partners from modifying ratings or comments

---

## ✅ Testing Checklist

### Freelance Barber
- [ ] Login as freelance barber
- [ ] Reviews screen loads successfully
- [ ] Shows reviews for this barber only
- [ ] Statistics calculate correctly
- [ ] Can filter by rating
- [ ] Can post response to review
- [ ] Pull-to-refresh works

### Barbershop Owner
- [ ] Login as barbershop owner
- [ ] Reviews screen loads successfully
- [ ] Shows reviews for this shop only
- [ ] Reviews can be from any staff member
- [ ] Statistics calculate correctly
- [ ] Can filter by rating
- [ ] Can post response to review
- [ ] Pull-to-refresh works

### Edge Cases
- [ ] No reviews yet (empty state)
- [ ] All reviews already have responses
- [ ] Filter returns 0 results
- [ ] Network error handling
- [ ] Very long comment text
- [ ] Special characters in response

---

## 📊 Current Limitations

1. **No Pagination**: Loads all reviews at once
   - Future: Add pagination for 1000+ reviews

2. **No Real-time Updates**: Must manually refresh
   - Future: Add Supabase real-time subscriptions

3. **No Image Support**: Reviews don't show customer photos
   - Future: Display review images if uploaded

4. **No Edit/Delete Response**: Once posted, cannot edit
   - Future: Add edit/delete functionality

5. **No Notification**: No alert when new review received
   - Future: Push notification on new review

---

## 🔄 Migration Path

### From Mock Data
```
OLD: const mockReviews = [...]
NEW: const reviews = await getPartnerReviews(userId, accountType)
```

### Stats Calculation
```
OLD: Manual calculation in component
NEW: getReviewStats(reviews)
```

### Posting Response
```
OLD: Alert only (no actual save)
NEW: await postReviewResponse(reviewId, text)
     + Update local state
```

---

## 📝 Related Files

### Created
- `packages/shared/services/reviewsService.ts` - Reviews service layer

### Modified
- `apps/partner/app/(tabs)/reviews.tsx` - Reviews screen UI
- Uses account type detection
- Integrated with reviews service

### Dependencies
- `packages/shared/config/supabase.ts` - Supabase client
- `packages/shared/types/database.ts` - Review type definitions
- `@react-native-async-storage/async-storage` - Account type storage

---

## 🚀 Next Steps

1. **Test with Real Data**
   - Create test reviews in Supabase
   - Test both account types
   - Verify statistics accuracy

2. **Add Pagination** (if needed)
   - Implement infinite scroll
   - Load reviews in batches of 20-50

3. **Real-time Updates**
   - Add Supabase subscriptions
   - Auto-refresh on new review

4. **Response Notifications**
   - Notify when partner responds
   - Push notification to customer

5. **Enhanced Features**
   - Edit/delete responses
   - Flag inappropriate reviews
   - Export reviews as PDF

---

## 🐛 Troubleshooting

### Reviews Not Loading?

**Check:**
1. Supabase connection working?
   - Test with: `supabase.from('reviews').select('count')`
2. User ID correct?
   - Log `currentUser.id`
3. Account type detected?
   - Log account type from AsyncStorage
4. Reviews exist in database?
   - Check Supabase dashboard

### Wrong Reviews Showing?

**Check:**
1. Query filtering correctly?
   - Freelance: Should filter by `barber_id`
   - Barbershop: Should filter by `barbershop_id`
2. User ID matches database?
   - Verify ID in `barbers` or `barbershops` table

### Response Not Posting?

**Check:**
1. Network connection working?
2. Review ID valid?
3. Response text not empty?
4. Supabase permissions correct (RLS)?

---

**Implementation Complete! ✅**

The Partner Reviews screen now uses **100% live Supabase data** with support for both freelance barbers and barbershops.

---

_Last updated: 2025-10-13 18:00 UTC_  
_Developer: bos (MacOS)_  
_Project: Mari Gunting Partner App_
