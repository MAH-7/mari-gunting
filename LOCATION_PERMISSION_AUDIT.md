# Location Permission Request Audit - Customer App

## Summary
Found **4 places** where the app asks for location permission.

---

## 1. Home Screen - Automatic Modal (MAIN ENTRY POINT) ⭐

**File:** `apps/customer/app/(tabs)/index.tsx`  
**Lines:** 234-247, 374-379  
**Type:** Modal (non-blocking)

### When it triggers:
- Automatically after **2 seconds** when home screen loads
- Only shows if permission is `not-asked`, `denied`, or `blocked`

### What user sees:
```
📍 Enable Location Access

Help us find the best barbers near you...

✓ Find nearby barbers
✓ Get directions & ETAs  
✓ Accurate pricing

[Enable Location] 🟢
[Enter Location Manually]
[Maybe Later]
```

### User options:
1. ✅ **Enable Location** → Requests permission
2. 📝 **Enter Location Manually** → Goes to `/profile/addresses`
3. ⏭️ **Maybe Later** → Dismisses (can use app)

### Frequency:
- Shows once per session if dismissed
- After 3 denials → Becomes "blocked" → Shows "Open Settings" option
- Won't show again for 24 hours if denied

---

## 2. Home Screen - Navigation Guard (NEW - We Added) ⭐

**File:** `apps/customer/app/(tabs)/index.tsx`  
**Lines:** 274-293  
**Type:** Modal (blocks navigation)

### When it triggers:
- When customer taps **"Freelance"** button without location
- When customer taps **"Barbershop"** button without location

### What happens:
```javascript
if (locationStatus !== 'granted') {
  setShowLocationModal(true); // Shows same modal as #1
  // Blocks navigation to /barbers or /barbershops
}
```

### Purpose:
- Prevents reaching empty barbers screen
- Clear context: "You need location to use this feature"

---

## 3. Barbers Screen - Empty State Fallback (NEW - We Added) ⭐

**File:** `apps/customer/app/barbers.tsx`  
**Line:** 555 (requestPermission call)  
**Type:** Button in empty state

### When it triggers:
- If user somehow reaches barbers screen without location
- Safety net / escape route

### What user sees:
```
🎯 (location icon)

Location Required

Enable location to find nearby barbers 
within your chosen radius

[📍 Enable Location] 🟢
```

### Purpose:
- Last resort if navigation guard fails
- Provides clear path forward

---

## 4. Map Picker Screen - Optional Feature

**File:** `apps/customer/app/profile/map-picker.tsx`  
**Line:** 70  
**Type:** Alert (non-blocking)

### When it triggers:
- When map loads, tries to jump to current location
- Only for **convenience**, not required

### What user sees:
```
Alert: "Permission Denied"
"Location permission is required to detect 
your current location."
```

### What happens next:
- User can still use map by **dragging manually**
- "Current Location" button in corner tries again if tapped
- Screen is fully functional without permission

---

## 5. LocationGuard Component (UNUSED) ❌

**File:** `apps/customer/components/LocationGuard.tsx`  
**Status:** Created but **NOT USED** anywhere

### What it does:
- Wraps screens that require location
- Shows full-screen permission request
- Blocks entire screen until permission granted

### Why it's not used:
- We chose modal approach (less intrusive)
- More flexible than full-screen block

**Recommendation:** Can be deleted or kept for future use.

---

## 6. useUserLocation Hook (UNUSED) ❌

**File:** `apps/customer/hooks/useBarbershops.ts`  
**Lines:** 200-231  
**Status:** Defined but **NOT USED** anywhere

### What it does:
- Auto-requests location when hook is called
- Returns location state

**Recommendation:** Can be deleted - we use `useLocation` instead.

---

## Complete User Journey

### **First Time User:**

```
1. Install app → Login/Onboarding
   ↓
2. Home screen loads
   ↓
3. [After 2 seconds] → LocationPermissionModal appears 🎯
   ├─ Enable → Permission granted ✅
   ├─ Manual → Go to addresses
   └─ Maybe Later → Dismissed
   
4. Taps "Freelance" button
   ├─ If granted → Navigate to barbers ✅
   └─ If denied → Modal appears again 🎯
   
5. On barbers screen (if location missing)
   └─ Shows empty state with "Enable Location" button 🎯
   
6. Profile → My Addresses → Add New
   └─ Map picker loads
       └─ Alert: "Permission Denied" (non-blocking)
       └─ Can still drag map manually ✅
```

---

## Summary by Priority

### **Critical (Blocks Features):**
1. ⭐ Home screen navigation guard → Blocks barbers/barbershops access
2. ⭐ Barbers screen empty state → Last resort

### **High (Encouraged but Not Blocking):**
3. ⭐ Home screen automatic modal → Educates user early

### **Low (Nice to Have):**
4. 📍 Map picker "Current Location" → Convenience feature

### **Unused:**
5. ❌ LocationGuard component
6. ❌ useUserLocation hook

---

## Total Permission Requests

### **Visible to User:**
- **3 active prompts** (Home modal, Navigation guard, Barbers empty state)
- **1 optional prompt** (Map picker current location)

### **In One Session:**
- Minimum: **1 time** (if granted on home screen)
- Maximum: **3 times** (if denied each time until blocked)

---

## Comparison to Grab

| Feature | Grab | Mari Gunting | Status |
|---------|------|--------------|--------|
| Initial prompt timing | On first ride request | After 2s on home | ✅ Better |
| Navigation blocking | Yes | Yes | ✅ Same |
| Fallback options | Manual address | Manual address | ✅ Same |
| Denial tracking | Yes (3 strikes) | Yes (3 strikes) | ✅ Same |
| Settings deep-link | Yes | Yes | ✅ Same |
| 24-hour cooldown | Yes | Yes | ✅ Same |

---

## Recommendations

### **Keep As-Is:**
✅ Home screen modal (2-second delay, non-blocking)  
✅ Navigation guard (blocks barbers/barbershops)  
✅ Barbers screen fallback (safety net)  
✅ Map picker optional request (convenience)  

### **Consider Removing:**
⚠️ LocationGuard component (unused)  
⚠️ useUserLocation hook (unused, redundant)  

### **Future Enhancement:**
💡 Add analytics to track:
- Permission acceptance rate
- Which screen converts best
- How many sessions until user grants permission

---

## Testing Checklist

**Fresh Install (No Permission):**
- [ ] Home screen loads → Wait 2s → Modal appears
- [ ] Tap "Maybe Later" → Modal dismisses
- [ ] Tap "Freelance" → Modal appears again
- [ ] Tap "Enable Location" → Permission prompt
- [ ] Grant permission → Navigate to barbers
- [ ] See barbers within 5km

**Permission Denied:**
- [ ] Deny permission 3 times
- [ ] Status becomes "blocked"
- [ ] Modal shows "Open Settings" option
- [ ] Tap "Open Settings" → Device settings open

**With Permission:**
- [ ] Open app with permission granted
- [ ] NO modal appears automatically
- [ ] Tap "Freelance" → Navigate immediately
- [ ] See barbers with distances

**Map Picker:**
- [ ] Without permission → Alert appears
- [ ] Can still drag map manually
- [ ] "Current Location" button available
- [ ] Tap button → Permission request
- [ ] Grant → Map jumps to location

---

## Conclusion

**Total places asking for location: 4**
1. Home screen automatic modal (after 2s) ⭐
2. Home screen navigation guard (on button tap) ⭐
3. Barbers screen empty state (fallback) ⭐
4. Map picker current location (optional) 📍

**UX is well-designed:** 
- Not too aggressive (allows "Maybe Later")
- Not too passive (blocks unusable features)
- Clear context (explains why needed)
- Good fallbacks (manual address entry)

**Matches Grab's standard! ✅**
