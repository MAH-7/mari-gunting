# Testing Guide: Partner Reviews Live Data

> **Quick Test Guide** for verifying the Partner Reviews screen with Supabase  
> **Estimated Time**: 10-15 minutes

---

## 📋 Prerequisites

- ✅ Supabase project configured (`.env` with credentials)
- ✅ Partner app can run (`npm start` in `apps/partner`)
- ✅ Test partner account (freelance barber OR barbershop)

---

## 🚀 Testing Steps

### **Step 1: Prepare Supabase Database** (5 mins)

#### 1.1 Open Supabase Dashboard
```bash
# Open in browser
open https://supabase.com/dashboard
```

Navigate to your project → **SQL Editor**

#### 1.2 Run Helper Queries

Copy and paste this query to check your setup:

```sql
-- Check if reviews table exists
SELECT 
  COUNT(*) as total_reviews,
  COUNT(DISTINCT barber_id) as unique_barbers,
  COUNT(DISTINCT barbershop_id) as unique_shops
FROM reviews;

-- Get your partner ID
SELECT 
  p.id as user_id,
  p.full_name,
  p.phone_number,
  b.id as barber_id
FROM profiles p
LEFT JOIN barbers b ON p.id = b.user_id
WHERE p.phone_number = '22-222 2222'  -- Your test partner phone
LIMIT 1;
```

**Note down** the `barber_id` or go to the `barbershops` table if you're testing a barbershop.

#### 1.3 Create Test Reviews (if none exist)

If you have **0 reviews**, use the SQL script we created:

```bash
# Open the test data script
open supabase/test-reviews-data.sql
```

Or manually create one review in Supabase:

1. Go to **Table Editor** → `reviews`
2. Click **Insert** → **Insert row**
3. Fill in:
   - `customer_id`: (get from profiles table)
   - `barber_id`: (your barber ID from above) OR `barbershop_id`
   - `rating`: 5
   - `comment`: "Great service!"
   - `is_visible`: true
4. Click **Save**

---

### **Step 2: Run Partner App** (2 mins)

#### 2.1 Start the Partner App

```bash
cd /Users/bos/Desktop/ProjectSideIncome/mari-gunting/apps/partner
npm start
```

Press `i` for iOS simulator or `a` for Android emulator

#### 2.2 Login

Use test credentials:
- **Phone**: `22-222 2222`
- **OTP**: Any 6 digits (e.g., `123456`)

---

### **Step 3: Navigate to Reviews Tab** (1 min)

1. After login, you should see the Partner dashboard
2. Tap the **Reviews** tab (star icon) at the bottom

---

### **Step 4: Verify Reviews Load** (2 mins)

#### What You Should See:

**If reviews exist:**
- ✅ **Hero Card** showing average rating
- ✅ **Statistics**: Total reviews, response rate
- ✅ **Rating Distribution** chart
- ✅ **Reviews List** with customer names

**If NO reviews:**
- ✅ Shows "No reviews yet" message (this is correct!)

#### Check Console Logs:

Look for these logs in your terminal:

```
📋 Loading reviews for partner: <user-id> Type: freelance
✅ Found X reviews for freelance
```

or

```
ℹ️ No reviews found for freelance: <user-id>
```

---

### **Step 5: Test Filtering** (1 min)

If you have reviews:

1. Tap **5⭐** filter button
2. Should show only 5-star reviews
3. Tap **All** to show all again

---

### **Step 6: Test Pull-to-Refresh** (1 min)

1. Pull down on the screen
2. Should show refresh indicator
3. Should reload reviews from Supabase

Check console for:
```
📋 Loading reviews for partner: <user-id> Type: freelance
```

---

### **Step 7: Test Posting a Response** (2 mins)

#### 7.1 Find a Review Without Response

Look for a review card with **"Reply to Review"** button

#### 7.2 Tap "Reply to Review"

Modal should open showing:
- Customer name and rating
- Review preview
- Text input for response

#### 7.3 Type a Response

Example: "Thank you for your feedback! We appreciate your business."

#### 7.4 Tap "Post Reply"

Should see:
- ✅ Loading spinner on button
- ✅ Success alert
- ✅ Modal closes
- ✅ Review card now shows your response

Check console for:
```
💬 Posting response to review: <review-id>
✅ Review response posted successfully
```

---

### **Step 8: Verify in Supabase** (1 min)

Go back to Supabase Dashboard:

1. Navigate to **Table Editor** → `reviews`
2. Find the review you just replied to
3. Check that `response` field is populated
4. Check that `response_at` timestamp is set

---

## ✅ Expected Results Checklist

### Loading & Display
- [ ] Reviews load from Supabase
- [ ] Shows loading spinner initially
- [ ] Customer names display correctly
- [ ] Service names display correctly
- [ ] Ratings display (1-5 stars)
- [ ] Dates formatted correctly (e.g., "Jan 10, 2025")

### Statistics
- [ ] Average rating calculated correctly
- [ ] Total reviews count correct
- [ ] Response rate percentage shows
- [ ] "Need Reply" count accurate
- [ ] Distribution chart shows correct bars

### Filtering
- [ ] "All" filter shows all reviews
- [ ] "5⭐" shows only 5-star reviews
- [ ] "4⭐" shows only 4-star reviews
- [ ] Filter badge shows total count
- [ ] Empty state shows if filter has 0 results

### Interactions
- [ ] Pull-to-refresh works
- [ ] Tapping review doesn't crash
- [ ] Reply modal opens correctly
- [ ] Can type in response field
- [ ] Post button disables while submitting
- [ ] Success message shows
- [ ] Response appears immediately in UI
- [ ] Response persists after refresh

### Account Type Detection
- [ ] Freelance barbers see their reviews
- [ ] Barbershops see their reviews
- [ ] Console logs show correct account type

---

## 🐛 Troubleshooting

### Issue: "No reviews found"

**Possible causes:**

1. **No reviews in database**
   - Solution: Create test reviews using SQL script
   
2. **Wrong account type detected**
   - Check: `AsyncStorage.getItem('partnerAccountType')`
   - Should be `'freelance'` or `'barbershop'`
   
3. **Wrong user ID**
   - Check console logs for user ID
   - Verify ID exists in `barbers` or `barbershops` table

4. **Reviews not visible**
   - Check `is_visible = true` in database

---

### Issue: "Error loading reviews"

**Possible causes:**

1. **Supabase connection failed**
   - Check `.env` has correct credentials
   - Test connection: `supabase.from('reviews').select('count')`

2. **Table doesn't exist**
   - Run migrations to create `reviews` table
   - Check Supabase dashboard → Table Editor

3. **RLS policies blocking access**
   - Check Row Level Security policies
   - Temporarily disable to test

---

### Issue: "Response not posting"

**Possible causes:**

1. **Network error**
   - Check internet connection
   - Check Supabase is online

2. **Empty response text**
   - Make sure you typed something

3. **RLS blocking update**
   - Check update permissions on `reviews` table

4. **Invalid review ID**
   - Check review ID in console logs

---

## 🔍 Debug Mode

To see more detailed logs, add this to the reviews screen:

```typescript
// In apps/partner/app/(tabs)/reviews.tsx
useEffect(() => {
  console.log('🔍 DEBUG - Current User:', currentUser);
  console.log('🔍 DEBUG - Account Type:', accountType);
  console.log('🔍 DEBUG - Reviews:', reviews);
  console.log('🔍 DEBUG - Stats:', stats);
}, [currentUser, accountType, reviews, stats]);
```

---

## 📊 Test Data Examples

### Sample Review Entry (Supabase)

```json
{
  "id": "uuid-here",
  "booking_id": "booking-uuid",
  "customer_id": "customer-uuid",
  "barber_id": "barber-uuid",
  "barbershop_id": null,
  "rating": 5,
  "comment": "Excellent service! Very professional.",
  "response": null,
  "response_at": null,
  "is_visible": true,
  "is_verified": false,
  "is_flagged": false,
  "created_at": "2025-01-10T14:30:00Z",
  "updated_at": "2025-01-10T14:30:00Z"
}
```

---

## 🎯 Quick Test Commands

```bash
# 1. Start partner app
cd apps/partner && npm start

# 2. Watch logs
# Look for these patterns:
# - 📋 Fetching reviews
# - ✅ Found X reviews
# - 💬 Posting response
# - ❌ Error (if any)

# 3. Check Supabase (browser)
open https://supabase.com/dashboard

# 4. Run SQL queries
# Use SQL Editor to verify data
```

---

## ✅ Success Criteria

Your test is **successful** if:

1. ✅ Reviews load from Supabase (not mock data)
2. ✅ Statistics calculate correctly
3. ✅ Can filter by rating
4. ✅ Can post response to review
5. ✅ Response saves to Supabase
6. ✅ Response appears in UI immediately
7. ✅ Pull-to-refresh works
8. ✅ No crashes or errors

---

## 📝 Testing Both Account Types

### Test Freelance Barber

1. Login with barber account
2. AsyncStorage should have: `partnerAccountType = 'freelance'`
3. Reviews should filter by `barber_id`
4. Console: `Type: freelance`

### Test Barbershop

1. Login with barbershop account
2. AsyncStorage should have: `partnerAccountType = 'barbershop'`
3. Reviews should filter by `barbershop_id`
4. Console: `Type: barbershop`

---

## 🎉 You're Done!

If all checks pass, your Partner Reviews screen is successfully using **live Supabase data**! 🚀

---

## 📸 Screenshots to Take

For documentation, capture:

1. Reviews list (with data)
2. Statistics card (average rating)
3. Rating distribution chart
4. Filter in action
5. Reply modal
6. Success message after posting response

---

**Questions?** Check `PARTNER_REVIEWS_LIVE_DATA.md` for detailed documentation.

---

_Testing completed: [Date]_  
_Tested by: bos_  
_Status: [ ] Pass / [ ] Fail_  
_Notes:_
