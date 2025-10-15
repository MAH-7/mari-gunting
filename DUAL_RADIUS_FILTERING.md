# Dual-Radius Filtering System

**Date:** October 13, 2025  
**Status:** ✅ Implemented

---

## Overview

The dual-radius filtering system ensures that barbers are only shown to customers when **BOTH** the customer's search preferences AND the barber's service capabilities are satisfied.

---

## 🎯 Two Radius Types

### 1. Customer's Search Radius
**Set by:** Customer in the app  
**Purpose:** "Show me barbers within X km from my location"  
**Options:** 5km, 10km, 15km, 20km  
**Default:** 5km

**Where it's used:**
- `apps/customer/app/barbers.tsx` - Barbers list screen
- Customer can change via radius selection modal

### 2. Barber's Service Radius
**Set by:** Barber during onboarding/registration  
**Purpose:** "I will travel up to X km to serve customers"  
**Options:** 1km, 5km, 10km, 15km, 20km  
**Default:** 20km (most barbers choose maximum)

**Stored in:**
- Database: `barbers.service_radius_km`
- App type: `Barber.serviceRadiusKm`

---

## 🔄 How It Works

### Filtering Logic:

```typescript
// A barber is shown to a customer ONLY IF:

1. Barber is within customer's search radius:
   barber.distance <= customer.searchRadius

AND

2. Customer is within barber's service area:
   barber.distance <= barber.serviceRadiusKm
```

---

## 📊 Example Scenarios

### Scenario 1: ✅ Perfect Match
```
Customer Location: KLCC
Customer Search Radius: 10km
Barber Location: Bangsar (5km away)
Barber Service Radius: 20km

✅ SHOWN
Reason:
- 5km <= 10km ✅ (within customer search)
- 5km <= 20km ✅ (within barber service area)
```

---

### Scenario 2: ❌ Barber Too Far for Customer
```
Customer Location: KLCC
Customer Search Radius: 5km
Barber Location: Subang (15km away)
Barber Service Radius: 20km

❌ HIDDEN
Reason:
- 15km > 5km ❌ (outside customer search)
- 15km <= 20km ✅ (within barber service area)

Result: Not shown because customer wants closer barbers
```

---

### Scenario 3: ❌ Customer Too Far for Barber
```
Customer Location: KLCC
Customer Search Radius: 20km
Barber Location: Bangsar (5km away)
Barber Service Radius: 3km

❌ HIDDEN
Reason:
- 5km <= 20km ✅ (within customer search)
- 5km > 3km ❌ (outside barber service area)

Result: Not shown because barber won't travel that far
```

---

### Scenario 4: ✅ Both Willing to Meet
```
Customer Location: KLCC
Customer Search Radius: 10km
Barber Location: Ampang (8km away)
Barber Service Radius: 10km

✅ SHOWN
Reason:
- 8km <= 10km ✅ (within customer search)
- 8km <= 10km ✅ (within barber service area)

Result: Perfect match - both parties are willing
```

---

## 💻 Implementation

### Type Definition
**File:** `packages/shared/types/index.ts`

```typescript
export interface Barber extends User {
  // ... other fields
  serviceRadiusKm: number;    // How far barber will travel (in km)
  distance?: number;          // Distance from customer (calculated)
  // ... other fields
}
```

---

### Mock Data
**File:** `packages/shared/services/mockData.ts`

```typescript
{
  id: 'b1',
  name: 'Amir Hafiz',
  // ... other fields
  serviceRadiusKm: 20,  // Willing to travel 20km
  distance: 3.2,        // Currently 3.2km from customer
  // ... other fields
}
```

**Mock barber service radiuses:**
- Amir Hafiz (b1): 20km
- Faiz Rahman (b2): 20km
- Azman Ibrahim (b3): 15km
- Danish Lee (b4): 20km

---

### Supabase API
**File:** `packages/shared/services/supabaseApi.ts`

```typescript
function transformBarberData(barber, profile, services) {
  return {
    // ... other fields
    serviceRadiusKm: barber.service_radius_km || 20, // Default 20km
    distance,  // Calculated from customer location
    // ... other fields
  };
}
```

---

### Customer App Filtering
**File:** `apps/customer/app/barbers.tsx`

```typescript
const filteredBarbers = barbers.filter(barber => {
  const matchesSearch = /* search logic */;
  
  // Customer's search radius: barber must be within customer's chosen radius
  const withinCustomerRadius = !barber.distance || barber.distance <= radius;
  
  // Barber's service radius: customer must be within barber's service area
  const withinBarberServiceArea = !barber.distance || barber.distance <= barber.serviceRadiusKm;
  
  return matchesSearch && 
         withinCustomerRadius && 
         withinBarberServiceArea && 
         barber.isOnline && 
         barber.isAvailable;
});
```

---

## 🎯 Benefits of Dual-Radius System

### For Customers:
✅ Only see barbers who will actually accept their booking  
✅ No disappointment from rejected bookings  
✅ Faster booking confirmation  
✅ Better user experience  

### For Barbers:
✅ No bookings they need to reject  
✅ Only see relevant booking requests  
✅ Better control over service area  
✅ More efficient operations  

### For Platform:
✅ Fewer booking rejections  
✅ Higher acceptance rate  
✅ Better metrics  
✅ Happier users  

---

## 📱 User Experience Flow

### Customer Journey:
1. **Open barbers list**
   - Default search radius: 5km
   - Sees barbers within 5km who will serve their location

2. **Expand search radius to 10km**
   - Sees more barbers
   - BUT only those whose service radius covers customer location

3. **Select barber**
   - Confident barber will accept
   - Proceeds to booking

4. **Booking confirmed**
   - No surprises
   - Clear expectations

### Barber Journey:
1. **Set service radius during onboarding**
   - Choose 1-20km based on preference
   - Most choose 20km for maximum coverage

2. **Receive booking request**
   - Always within service radius
   - Can confidently accept

3. **Accept booking**
   - No distance surprises
   - Clear travel distance upfront

---

## 🔍 Edge Cases Handled

### Case 1: No Distance Available
```typescript
const withinCustomerRadius = !barber.distance || barber.distance <= radius;
```
- If distance not calculated, show barber (graceful fallback)
- Prevents hiding barbers due to missing data

### Case 2: Barber Without Service Radius
```typescript
serviceRadiusKm: barber.service_radius_km || 20
```
- Default to 20km if not set
- Ensures backward compatibility

### Case 3: Location Permission Denied
- Distance-based filtering disabled
- Shows all online/available barbers
- User sees warning about accuracy

---

## 📊 Database Schema

### Barbers Table:
```sql
barbers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  service_radius_km INTEGER DEFAULT 20,
  -- How far barber willing to travel
  -- Range: 1-20 km
  -- Default: 20 km
  ...
)
```

### Calculation:
```sql
-- In production, use PostGIS for distance calculation
SELECT 
  b.*,
  ST_Distance(
    ST_MakePoint(p.location),
    ST_MakePoint(?, ?)  -- Customer location
  ) / 1000 as distance_km
FROM barbers b
JOIN profiles p ON b.user_id = p.id
WHERE 
  -- Customer's radius filter
  ST_DWithin(
    ST_MakePoint(p.location),
    ST_MakePoint(?, ?),
    ? * 1000  -- Customer search radius
  )
  AND
  -- Barber's service radius
  ST_DWithin(
    ST_MakePoint(p.location),
    ST_MakePoint(?, ?),
    b.service_radius_km * 1000
  )
```

---

## 🧪 Testing Checklist

### Unit Tests:
- [ ] Barber within both radiuses → ✅ shown
- [ ] Barber outside customer radius → ❌ hidden
- [ ] Barber outside service radius → ❌ hidden
- [ ] Barber outside both radiuses → ❌ hidden
- [ ] Missing distance data → ✅ shown (fallback)
- [ ] Missing service radius → ✅ shown with 20km default

### Integration Tests:
- [ ] Change customer radius → updates list
- [ ] Barbers list respects both radiuses
- [ ] Database query filters correctly
- [ ] API transformation includes serviceRadiusKm

### User Acceptance Tests:
- [ ] Customer sees relevant barbers
- [ ] No rejected bookings due to distance
- [ ] Barber settings work correctly
- [ ] Search radius selector works

---

## 🚀 Performance Considerations

### Optimization Tips:

1. **Database Level:**
   - Use spatial indexes on location columns
   - Pre-calculate distances during query
   - Cache barber service radiuses

2. **API Level:**
   - Filter at database level, not app level
   - Return only necessary fields
   - Use pagination for large result sets

3. **Client Level:**
   - Filter on already-fetched data when possible
   - Update only when radius changes
   - Show loading states during re-fetch

---

## 📈 Analytics to Track

### Metrics:
- Average customer search radius selected
- Distribution of barber service radiuses
- Booking acceptance rate (should be ~100%)
- Time to first booking acceptance
- Customer satisfaction scores

### KPIs:
- **Target:** <5% booking rejection rate
- **Target:** >95% barber acceptance rate
- **Target:** <2 minutes average acceptance time

---

## 🔮 Future Enhancements

### Possible Improvements:

1. **Dynamic Pricing:**
   - Higher prices for longer distances
   - Surge pricing for peak times

2. **Smart Radius:**
   - AI-suggested radius based on area
   - Automatic radius expansion if no barbers found

3. **Radius Visualization:**
   - Show coverage area on map
   - Visual feedback for radius changes

4. **Barber Radius Management:**
   - Allow barbers to change radius in real-time
   - Temporary radius reduction during busy times

---

## 📚 Related Documentation

- `BARBER_AVAILABILITY_FILTER_UPDATE.md` - Dual online/available filtering
- `CUSTOMER_APP_REAL_DATA_IMPLEMENTATION.md` - Supabase integration
- `MAPBOX_SETUP_COMPLETE.md` - Location services setup

---

## 🎯 Summary

The dual-radius filtering system ensures:

✅ **Better Matching** - Only show relevant barbers  
✅ **Fewer Rejections** - Barbers only see bookings they can accept  
✅ **Better Experience** - Clear expectations for both parties  
✅ **Higher Efficiency** - Less wasted time for everyone  

**Status:** Fully implemented and ready to use! 🚀
