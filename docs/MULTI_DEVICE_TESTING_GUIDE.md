# Multi-Device Testing Guide - Mari-Gunting

## 🎯 Goal: Test Customer App on MacBook + Partner/Barber App on Phone

**Your Setup:**
- 💻 **MacBook:** Customer app (Expo web or iOS Simulator)
- 📱 **Phone:** Partner/Barber app (real device via Expo Go)
- 🔄 **Real-time testing:** Customer books → Barber sees & accepts

This is the **ideal way** to test your marketplace! You'll experience the full flow from both sides.

---

## 📋 Prerequisites Checklist

Before multi-device testing:

- [ ] Database migrations applied (all 6 + test data)
- [ ] Supabase project configured
- [ ] Both apps have correct `.env` files
- [ ] MacBook and phone on same WiFi (for best performance)
- [ ] Expo Go installed on phone
- [ ] Partner/Barber app exists in your project

---

## 🏗️ Current Project Structure

Let me check if you have a Partner/Barber app:

```
mari-gunting/
├── apps/
│   ├── customer/     ← You have this (Customer app)
│   └── partner/      ← Do you have this? (Barber/Partner app)
```

**If you DON'T have a Partner app yet:**
- You'll need to create it first (I can help!)
- For now, test with 2 customer accounts on different devices

**If you DO have a Partner app:**
- Follow the setup below

---

## 🎭 Testing Scenarios

### **Option A: Full Marketplace Test** (Customer + Barber)
**Best for:** Testing the complete booking flow

**Setup:**
- MacBook: Customer app
- Phone: Barber app
- Different user accounts for each

### **Option B: Multi-Customer Test** (2 Customers)
**Best for:** Testing customer features only

**Setup:**
- MacBook: Customer account 1 (Ahmad)
- Phone: Customer account 2 (Siti)
- Test favorites, reviews, etc.

---

## 🚀 Setup Instructions

### **Step 1: Prepare Test Users** (5 mins)

You already have test users from `999_test_data.sql`:

#### **Customer Users:**
1. **Ahmad Fauzi**
   - ID: `00000000-0000-0000-0000-000000000001`
   - Phone: +60123456789
   - Has: 5 bookings, 2 addresses

2. **Siti Nurhaliza**
   - ID: `00000000-0000-0000-0000-000000000002`
   - Phone: +60124567890
   - Has: 1 booking

3. **Lee Wei Ming**
   - ID: `00000000-0000-0000-0000-000000000003`
   - Phone: +60125678901
   - Has: 1 booking

4. **Raj Kumar**
   - ID: `00000000-0000-0000-0000-000000000004`
   - Phone: +60126789012

#### **Barber Users:**
1. **Hairul Nizam**
   - ID: `10000000-0000-0000-0000-000000000001`
   - Phone: +60127890123
   - Business: Hairul Pro Cuts
   - Rating: 4.8

2. **Jason Tan**
   - ID: `10000000-0000-0000-0000-000000000002`
   - Phone: +60128901234
   - Business: Jason The Barber
   - Rating: 4.9

---

### **Step 2: Update Mock Auth for Multi-User** (10 mins)

Your current mock auth likely only supports one user. Let's enhance it:

#### **Update Customer App Mock Auth:**

**File:** `apps/customer/app/auth/login.tsx`

Add user selection:

```typescript
// Mock users database
const MOCK_USERS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    phone: '+60123456789',
    name: 'Ahmad Fauzi',
    role: 'customer'
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    phone: '+60124567890',
    name: 'Siti Nurhaliza',
    role: 'customer'
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    phone: '+60125678901',
    name: 'Lee Wei Ming',
    role: 'customer'
  }
];

// In your login handler:
const handleLogin = (phone: string) => {
  const user = MOCK_USERS.find(u => u.phone === phone);
  if (user) {
    // Store user data
    AsyncStorage.setItem('userId', user.id);
    AsyncStorage.setItem('userRole', user.role);
    // Navigate to main app
  }
};
```

---

### **Step 3: Run Customer App on MacBook** (2 mins)

#### **Option A: Web (Easiest for MacBook)**

```bash
cd apps/customer
npm start
# Press 'w' for web
```

Opens in browser at `http://localhost:19006`

**Pros:**
- Fastest reload
- Easy debugging with Chrome DevTools
- Good for UI testing

**Cons:**
- Some native features may not work
- Different feel than mobile

---

#### **Option B: iOS Simulator (More realistic)**

```bash
cd apps/customer
npm start
# Press 'i' for iOS Simulator
```

**Pros:**
- Realistic mobile experience
- Test native features
- Same UI as real device

**Cons:**
- Slower than web
- Uses more resources

---

### **Step 4: Run Partner/Barber App on Phone** (2 mins)

#### **If you have a Partner app:**

```bash
# In a NEW terminal window
cd apps/partner
npm start
```

**On your phone:**
1. Open Expo Go app
2. Scan the QR code
3. Wait for app to load

---

#### **If you DON'T have a Partner app (Workaround):**

**Option 1:** Run Customer app on phone too (test as different customer)
```bash
# Same terminal as before, scan QR with phone
cd apps/customer
npm start
# Scan QR on phone
```

**Option 2:** Use iOS Simulator for second customer
```bash
# Open second simulator
xcrun simctl boot "iPhone 15 Pro"  # Different model
# Then run app again
```

---

### **Step 5: Login as Different Users** (2 mins)

#### **On MacBook (Customer App):**
1. Open app
2. Go to login
3. Enter: `+60123456789` (Ahmad)
4. Enter any OTP (mock accepts anything)
5. ✅ Logged in as Ahmad Fauzi

#### **On Phone (Partner/Barber App):**
1. Open app
2. Go to login
3. Enter: `+60127890123` (Hairul - Barber)
4. Enter any OTP
5. ✅ Logged in as Hairul Nizam (Barber)

---

## 🎬 Testing Scenarios

### **Scenario 1: Complete Booking Flow** 🔥

**MacBook (Customer - Ahmad):**
1. Browse barbers
2. Select Hairul Nizam
3. Choose "Fade Haircut" (RM 35)
4. Select date & time (tomorrow, 3:00 PM)
5. Choose address (Home)
6. Add note: "Please bring fade tools"
7. Create booking
8. ✅ View in "Upcoming" tab

**Phone (Barber - Hairul):**
1. Check "New Bookings" tab
2. 🔔 See Ahmad's booking request
3. View booking details
4. Accept booking
5. ✅ Booking confirmed

**Back to MacBook (Customer):**
1. Pull to refresh bookings
2. ✅ See booking status changed to "Accepted"
3. 🎉 Notification: "Hairul accepted your booking!"

---

### **Scenario 2: Real-Time Updates**

**MacBook (Customer):**
1. Open booking details for upcoming booking
2. Keep screen open

**Phone (Barber):**
1. Change booking status to "In Progress"

**MacBook:**
1. Pull to refresh
2. ✅ See status update in real-time
3. Status timeline updates automatically

---

### **Scenario 3: Cancellation Flow**

**MacBook (Customer):**
1. Go to upcoming booking
2. Tap "Cancel Booking"
3. Select reason: "Schedule conflict"
4. Confirm cancellation

**Phone (Barber):**
1. Pull to refresh
2. ✅ Booking disappears from "Upcoming"
3. 🔔 Shows in "Cancelled" tab

---

### **Scenario 4: Review After Completion**

**Phone (Barber):**
1. Open completed booking
2. Mark as "Completed"
3. Add notes: "Customer was satisfied"

**MacBook (Customer):**
1. Pull to refresh
2. ✅ Booking shows as "Completed"
3. Tap "Write Review"
4. Give 5 stars
5. Write: "Great service!"
6. Submit review

**Phone (Barber):**
1. Check reviews section
2. ✅ See new 5-star review
3. View profile rating updated

---

## 🔧 Technical Setup

### **Shared Supabase Instance**

Both apps must use the **same Supabase project**.

**Check `.env` files match:**

```bash
# apps/customer/.env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# apps/partner/.env (same values!)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

---

### **Network Considerations**

**For best real-time updates:**

1. **Both devices on same WiFi**
   - MacBook: Connected to WiFi
   - Phone: Connected to same WiFi (not cellular)

2. **Enable Supabase Realtime** (if using)
   - Go to Supabase Dashboard
   - Database → Replication
   - Enable realtime for `bookings` table

3. **Firewall Settings**
   - Make sure MacBook firewall allows Expo
   - Allow incoming connections for Metro bundler

---

## 🐛 Troubleshooting

### **Phone can't connect to Metro bundler**

**Solution 1:** Use tunnel
```bash
npm start -- --tunnel
```

**Solution 2:** Make sure same WiFi
```bash
# Check MacBook IP
ifconfig | grep "inet " | grep -v 127.0.0.1
# Should see something like 192.168.1.x
```

---

### **Changes not reflecting on phone**

**Solution:**
```bash
# Shake phone → Reload
# Or in Expo Go: Press 'r' in terminal
```

---

### **Mock auth not working with different users**

**Solution:** Clear app data between tests
```typescript
// In login screen, add logout button
await AsyncStorage.clear();
```

---

### **Database shows old data**

**Solution:** Hard refresh queries
```typescript
// In React Query
queryClient.invalidateQueries(['bookings']);
```

---

## 📊 Testing Checklist

### **Pre-Test Setup:**
- [ ] Database has test data
- [ ] Both apps running successfully
- [ ] Logged in as different users
- [ ] Can see test bookings in customer app

### **Booking Flow:**
- [ ] Customer can browse barbers
- [ ] Customer can create booking
- [ ] Barber receives booking notification
- [ ] Barber can accept booking
- [ ] Customer sees accepted status
- [ ] Both see same booking details

### **Status Updates:**
- [ ] Barber can start service
- [ ] Customer sees "In Progress"
- [ ] Barber can complete
- [ ] Customer sees "Completed"

### **Cancellation:**
- [ ] Customer can cancel upcoming
- [ ] Barber sees cancellation
- [ ] Refund logic works (if implemented)

### **Reviews:**
- [ ] Customer can write review after completion
- [ ] Review appears in barber profile
- [ ] Rating updates correctly

### **Real-Time:**
- [ ] Pull-to-refresh works
- [ ] Status changes sync
- [ ] No stale data issues

---

## 🎯 Recommended Testing Order

### **Day 1: Basic Setup**
1. Apply database migrations
2. Get both apps running
3. Test login on both devices
4. View test bookings

### **Day 2: Viewing Data**
1. Browse barbers (customer)
2. View booking list (both)
3. View booking details (both)
4. Test pull-to-refresh

### **Day 3: Creating Bookings**
1. Implement booking creation
2. Test from customer app
3. Verify appears in database
4. Check barber app sees it

### **Day 4: Status Management**
1. Barber accepts booking
2. Customer sees update
3. Barber starts service
4. Barber completes
5. Customer reviews

---

## 💡 Pro Tips

### **For Efficient Testing:**

1. **Use Multiple Simulator Windows**
   ```bash
   # Open 2 iOS simulators at once
   open -a Simulator
   # Select different device models
   ```

2. **Quick User Switching**
   - Add debug panel with user switcher
   - Fast logout/login for testing different users

3. **Database Shortcuts**
   - Save SQL queries for common operations
   - Quick data reset script for clean tests

4. **Logging**
   - Add console logs for status changes
   - Monitor both apps' consoles side-by-side

5. **Screenshots**
   - Document successful flows
   - Save for bug reports

---

## 🚨 Common Issues

### **Issue: Data not syncing between apps**

**Cause:** RLS policies blocking data access

**Fix:**
```sql
-- Check if policies allow cross-user visibility
-- In Supabase SQL Editor:
SELECT * FROM bookings WHERE id = 'booking_id';
-- Test with both user IDs
```

### **Issue: Barber can't see customer bookings**

**Cause:** RLS policy restricts to barber's own bookings only

**Fix:** Update `002_rls_policies.sql`:
```sql
-- Barbers should see bookings assigned to them
CREATE POLICY "Barbers can view their bookings"
  ON bookings FOR SELECT
  USING (
    barber_id IN (
      SELECT id FROM barbers WHERE user_id = auth.uid()
    )
  );
```

---

## 📱 Alternative: Both Apps on Same Device

If you only have one device:

### **Option 1: Web + Mobile**
- Customer app: MacBook web browser
- Barber app: MacBook iOS Simulator

### **Option 2: Split Screen (iPad)**
- Customer app: Left half
- Barber app: Right half
- Split screen in iOS Simulator

### **Option 3: Time-Based Testing**
- Login as customer
- Create booking
- Logout
- Login as barber
- Accept booking
- Logout
- Login as customer
- Verify status

---

## 🎉 Success Metrics

**You'll know multi-device testing is working when:**

✅ Customer creates booking on MacBook  
✅ Booking appears in Supabase database  
✅ Barber app on phone shows new booking  
✅ Barber accepts → Customer sees update  
✅ Status changes sync between devices  
✅ No RLS policy errors  
✅ Real-time feel of marketplace  

---

## 📞 Next Steps

**After multi-device setup:**

1. **Document the flows** that work
2. **Identify gaps** in functionality
3. **Fix critical issues** first
4. **Add real-time** subscriptions (optional)
5. **Test edge cases** (network issues, etc.)

---

## 🔗 Related Docs

- **Database Setup:** `DATABASE_SETUP_GUIDE.md`
- **Full Roadmap:** `FULL_ASSESSMENT_AND_ROADMAP.md`
- **Auth Setup:** `AUTHENTICATION_SETUP_GUIDE.md`

---

**Ready to test like a pro!** 🚀

**Quick Start:**
1. Run `npm start` in `apps/customer`
2. Open on MacBook (web or simulator)
3. Login as Ahmad
4. Create a booking
5. Check Supabase to verify it saved

**Then:**
- Add Partner/Barber app
- Test the full flow
- Experience your marketplace in action!
