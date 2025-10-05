# 🧪 Testing Guide: Barbershop Staff Integration

## ✅ What to Test

Your app is already running on port 8081. Follow this testing checklist to verify the barbershop staff integration works correctly.

---

## 📱 Test Scenarios

### Test 1: Browse Barbershops
**Goal**: Verify barbershops are displaying correctly

1. Open the app (Expo should be running on port 8081)
2. Navigate to **Barbershops** tab (bottom navigation)
3. **Expected Results**:
   - ✅ See list of 10 barbershops
   - ✅ Each shop shows: name, rating, distance, services
   - ✅ Filter buttons work (Open Now, All Shops)
   - ✅ Sort options work (Nearest, Popular, Rating)

**Sample Shops to Look For**:
- Kedai Gunting Rambut Ali (4.8★)
- The Gentleman Barber (4.9★)
- Barbershop Mat Rock (4.7★)
- Executive Grooming Lounge (4.9★)

---

### Test 2: View Barbershop Details
**Goal**: Verify individual shop pages load

1. From barbershops list, tap on **"The Gentleman Barber"**
2. **Expected Results**:
   - ✅ Shop details page loads
   - ✅ See shop photos in carousel
   - ✅ See operating hours
   - ✅ See shop services and prices
   - ✅ See reviews
   - ✅ "Book a Barber" button visible

---

### Test 3: View Shop Staff List ⭐ (MAIN TEST)
**Goal**: Verify shop staff are displayed (NOT freelance barbers)

1. From "The Gentleman Barber" detail page
2. Tap **"Book a Barber"** button
3. **Expected Results**:
   - ✅ Navigate to staff selection screen
   - ✅ See header: "Select Your Barber"
   - ✅ See shop info banner with shop name
   - ✅ See **2 staff members**:
     - **Vincent Lee** (TGB-001) - 4.9★, 782 jobs
     - **Adrian Tan** (TGB-002) - 4.8★, 523 jobs
   - ✅ Each staff card shows:
     - Avatar image
     - Name with verification badge
     - Rating and review count
     - Completed jobs
     - **"Available Today"** badge (NOT "Available Now")
     - Specializations (e.g., "Premium Cuts", "Modern Fades")
     - Starting price
     - "Select" button

**🚨 CRITICAL CHECK**: 
- ❌ Should NOT see freelance barbers (Amir Hafiz, Faiz Rahman, etc.)
- ✅ Should ONLY see staff for this specific shop

---

### Test 4: Try Different Shops
**Goal**: Verify staff filtering works correctly per shop

**Shop 1: Kedai Gunting Rambut Ali**
1. Go to this shop → "Book a Barber"
2. **Expected**: See 2 staff
   - Rahim Abdullah (KGA-001)
   - Ismail Hassan (KGA-002)

**Shop 4: Barbershop Mat Rock**
1. Go to this shop → "Book a Barber"
2. **Expected**: See 2 staff
   - Mat Rock (BMR-001)
   - Kamarul Izwan (BMR-002)

**Shop 7: Executive Grooming Lounge**
1. Go to this shop → "Book a Barber"
2. **Expected**: See 2 staff
   - James Khoo (EGL-001)
   - Samuel Wong (EGL-002)

**Shop 3: Salon Lelaki Kasual**
1. Go to this shop → "Book a Barber"
2. **Expected**: See 1 staff
   - Zul Azman (SLK-001)

**🚨 KEY POINT**: Each shop should show DIFFERENT staff members!

---

### Test 5: Book with Shop Staff
**Goal**: Complete booking flow with staff member

1. From "The Gentleman Barber" staff list
2. Tap **"Select"** on Vincent Lee
3. **Expected Results**:
   - ✅ Navigate to booking confirmation screen
   - ✅ See "Walk-In Info" banner: "Barbershop Visit"
   - ✅ See shop information section
   - ✅ See staff name: Vincent Lee
   - ✅ Can select multiple services
   - ✅ Can select date (next 7 days)
   - ✅ Can select time slot
   - ✅ Price breakdown shows:
     - Service price (e.g., RM 55)
     - **Travel Cost: RM 0.00** ← NO TRAVEL COST!
     - Platform Fee: RM 2.00
     - Total calculated correctly
   - ✅ "Book Now" button enabled after selections

---

### Test 6: Compare with Freelance Barbers
**Goal**: Verify freelance barbers still work independently

1. Navigate to **Home** tab
2. Scroll to "Popular Barbers" section
3. Tap on **Amir Hafiz** (freelance barber)
4. **Expected Results**:
   - ✅ See freelance barber profile
   - ✅ Shows "Currently in KLCC area"
   - ✅ Shows distance (e.g., "3.2 km")
   - ✅ "Book Now" button available
   - ✅ When booking, travel cost IS calculated

**OR try Quick Book**:
1. Tap **"Quick Book"** from home
2. Set radius and budget
3. Tap "Quick Book"
4. **Expected**: Should match with freelance barber, not shop staff

---

### Test 7: Visual Differences
**Goal**: Verify UI correctly reflects staff vs freelance differences

**Barbershop Staff**:
- Badge: **"Available Today"** (green)
- Status: Based on shop hours
- NO distance shown
- NO "Currently in..." location text
- Employee number shown (e.g., KGA-001)

**Freelance Barbers**:
- Badge: **"Available Now"** (green) or "Offline" (grey)
- Status: Real-time online/offline
- Distance shown (e.g., "3.2 km")
- "Currently in KLCC area" text
- NO employee number

---

## 🐛 Common Issues to Check

### Issue 1: Empty Staff List
**Symptom**: "No Barbers Available" message
**Check**: 
```typescript
// In services/api.ts
api.getBarbersByShopId(shopId)
// Should return mockBarbershopStaff filtered by barbershopId
```

### Issue 2: Wrong Barbers Showing
**Symptom**: Seeing freelance barbers (Amir, Faiz) in shop staff list
**Fix**: Verify API is filtering by `barbershopId`

### Issue 3: Missing Staff
**Symptom**: Some shops show 0 staff
**Check**: Your `mockBarbershopStaff` covers these shops:
- shop1, shop2, shop3, shop4, shop7, shop10
- Shops 5, 6, 8, 9 may have 0 staff (not assigned yet)

### Issue 4: Travel Cost Shown
**Symptom**: Barbershop booking shows travel cost > 0
**Fix**: Booking screen should set `travelCost = 0` for barbershop bookings

---

## ✅ Success Criteria

All tests pass if:

1. ✅ Barbershop list displays correctly
2. ✅ Each shop shows its own staff members
3. ✅ Staff list is DIFFERENT from freelance barbers
4. ✅ Staff cards show "Available Today" (not "Online")
5. ✅ NO distance/location shown for staff
6. ✅ Booking with staff shows RM 0 travel cost
7. ✅ Freelance barbers (Quick Book, Choose Barber) still work
8. ✅ No TypeScript errors in console
9. ✅ No runtime errors when navigating
10. ✅ Data is correctly separated (no mixing)

---

## 📊 Test Results Template

Copy and fill this out as you test:

```
## Test Results - Barbershop Staff Integration
Date: _____________
Tester: ___________

[ ] Test 1: Browse Barbershops - PASS/FAIL
    Notes: _________________________________

[ ] Test 2: View Shop Details - PASS/FAIL
    Notes: _________________________________

[ ] Test 3: View Staff List - PASS/FAIL
    Shop tested: ___________________________
    Staff count: ___________________________
    Staff names seen: ______________________
    Notes: _________________________________

[ ] Test 4: Different Shops - PASS/FAIL
    Shops tested: __________________________
    Notes: _________________________________

[ ] Test 5: Complete Booking - PASS/FAIL
    Travel cost shown: RM __________________
    Notes: _________________________________

[ ] Test 6: Freelance Comparison - PASS/FAIL
    Notes: _________________________________

[ ] Test 7: Visual Differences - PASS/FAIL
    Notes: _________________________________

Overall Result: PASS / FAIL
Issues Found: ______________________________
___________________________________________
___________________________________________
```

---

## 🎯 Quick Test Script

If you want to do a FAST smoke test:

```bash
1. Open app
2. Go to Barbershops → The Gentleman Barber
3. Tap "Book a Barber"
4. Verify: See Vincent Lee & Adrian Tan
5. Verify: Badge says "Available Today"
6. Verify: NO distance shown
7. Select Vincent → Verify travel cost = RM 0.00
8. Go back → Home → Tap Amir Hafiz
9. Verify: Shows distance & "Currently in..."
10. DONE! ✅
```

---

## 🔍 Debug Console Checks

Open React Native debugger and check console for:

**Good Signs**:
```
✅ Booking created and stored: bk1234567890
✅ Query successful: getBarbersByShopId(shop2)
✅ Found 2 staff members for shop2
```

**Bad Signs**:
```
❌ Error: Barber not found
❌ Warning: Expected BarbershopStaff but got Barber
❌ TypeError: Cannot read property 'barbershopId'
```

---

## 📱 Testing on Different Devices

If possible, test on:
- [ ] iOS Simulator
- [ ] Android Emulator  
- [ ] Physical iOS device
- [ ] Physical Android device

The behavior should be identical across all platforms!

---

## 🎉 When All Tests Pass

If all tests pass, mark the final todo as complete!

Then you'll have:
- ✅ Clear separation between freelance and shop staff
- ✅ Three working booking flows (Quick Book, Choose Barber, Barbershop)
- ✅ Correct pricing for each flow type
- ✅ Type-safe implementation
- ✅ Realistic mock data

**Ready for production!** 🚀
