# Service Radius Management

## Overview

The Service Radius feature allows freelance barbers to define how far they're willing to travel to serve customers. This is a critical business setting that impacts customer-barber matching and affects the booking system's efficiency.

## Key Concepts

### Service Radius
- **Definition**: The maximum distance (in kilometers) a barber is willing to travel from their current location to provide services
- **Range**: 1-20 km
- **Default**: Set during onboarding (typically 10 km)
- **Applies to**: Freelance barbers only (barbershops have fixed locations)

### 24-Hour Cooldown System

To prevent frequent changes that could disrupt the matching system and customer experience, we implement a **24-hour cooldown** between radius changes.

#### Why Cooldown?

1. **Consistency**: Ensures customers see stable barber availability
2. **Prevents Gaming**: Stops barbers from constantly adjusting radius to game the system
3. **Reduces Database Load**: Limits excessive updates
4. **Business Stability**: Encourages thoughtful radius decisions

#### How It Works

1. **First Change**: Barbers can change their service radius immediately upon account creation
2. **Subsequent Changes**: After the first change, a 24-hour cooldown period begins
3. **Cooldown Tracking**: The `last_radius_change_at` timestamp records when the last change occurred
4. **Enforcement**: API and UI both enforce the cooldown - attempts to change within 24 hours are rejected
5. **Visual Feedback**: UI shows remaining hours until next change is allowed

## Database Schema

### Fields in `barbers` table

```sql
-- Service radius in kilometers (1-20 km)
service_radius_km INTEGER DEFAULT 10 NOT NULL
  CHECK (service_radius_km >= 1 AND service_radius_km <= 20),

-- Timestamp of last radius change (for 24-hour cooldown)
last_radius_change_at TIMESTAMPTZ,
```

### Constraints

- `service_radius_km` must be between 1 and 20 (enforced by CHECK constraint)
- `last_radius_change_at` is nullable (null = never changed)
- Index on `last_radius_change_at` for efficient cooldown checks

## API Implementation

### `barberService.canChangeServiceRadius(barberId: string)`

**Purpose**: Check if a barber can currently change their service radius

**Returns**:
```typescript
{
  canChange: boolean;        // true if cooldown expired or never changed
  hoursRemaining: number;    // hours until next change allowed (0 if can change)
  lastChangedAt: string | null;  // ISO timestamp of last change
}
```

**Logic**:
1. Fetch `last_radius_change_at` from database
2. If `null`, return `canChange: true` (never changed)
3. Calculate hours since last change
4. If >= 24 hours, return `canChange: true`
5. Otherwise, return `canChange: false` with hours remaining

### `barberService.updateServiceRadius(barberId: string, newRadius: number)`

**Purpose**: Update service radius with cooldown enforcement

**Parameters**:
- `barberId`: The barber's ID
- `newRadius`: New radius in km (1-20)

**Returns**:
```typescript
{
  success: boolean;
  message: string;
  hoursRemaining?: number;  // Only if cooldown active
}
```

**Validation**:
1. Check if `newRadius` is a valid integer between 1-20
2. Call `canChangeServiceRadius()` to check cooldown
3. If cooldown active, reject with error message
4. If allowed, update both `service_radius_km` and `last_radius_change_at`

**Error Handling**:
- Invalid radius → "Invalid radius. Must be between 1 and 20 km."
- Cooldown active → "You can change your service radius again in X hours."
- Database error → "Failed to update service radius. Please try again."
- Barber not found → "Barber not found."

## UI Implementation

### Component: `ServiceRadiusSettings`

**Location**: `apps/partner/components/ServiceRadiusSettings.tsx`

**Props**:
```typescript
interface ServiceRadiusSettingsProps {
  barberId: string;
  currentRadius: number;
  onRadiusChanged?: (newRadius: number) => void;
}
```

**Features**:
- Displays current service radius prominently
- Shows last change timestamp in human-readable format
- Button to change radius (disabled during cooldown)
- Modal with 4 preset options: 5km, 10km, 15km, 20km
- Confirmation dialog before saving
- Loading states during API calls
- Clear error messages

**User Flow**:

1. **Can Change** (cooldown expired):
   - Button shows "Change Radius" (enabled)
   - Click opens modal with radius options
   - Select new radius
   - Confirm change (warning about 24-hour cooldown)
   - Success message → cooldown activated

2. **Cannot Change** (cooldown active):
   - Button shows "Wait Xh" (disabled)
   - Click shows alert explaining cooldown and hours remaining
   - User must wait until cooldown expires

### Integration

**Location**: `apps/partner/app/(tabs)/profile.tsx`

The component is displayed at the top of the profile screen, only for:
- **Freelance barbers** (not barbershops)
- **Barbers with a service radius set** (during onboarding)

```tsx
{accountType === 'freelance' && profile?.serviceRadiusKm && (
  <ServiceRadiusSettings
    barberId={profile.id}
    currentRadius={profile.serviceRadiusKm}
    onRadiusChanged={async (newRadius) => {
      // Update local state
      setProfile(prev => prev ? { ...prev, serviceRadiusKm: newRadius } : null);
      // Refresh profile from backend
      await loadBarberProfile(false);
    }}
  />
)}
```

## Customer-Facing Impact

### Dual-Radius Filtering

When customers search for barbers, the system applies **dual-radius filtering**:

1. **Customer's search radius**: The maximum distance the customer is willing for a barber to travel
2. **Barber's service radius**: The maximum distance the barber is willing to travel

**Matching Logic**:
```
Show barber IF:
  - distance(customer, barber) <= customer_search_radius
  AND
  - distance(customer, barber) <= barber_service_radius
```

This prevents mismatches where:
- Customer selects 15km search radius
- Barber has 5km service radius
- They're 10km apart
- Without dual filtering, barber would appear but can't service → poor UX

### Real-time Updates

When a barber changes their service radius:
- They immediately appear/disappear in relevant customer searches
- Existing bookings are not affected
- The change is reflected in all future searches

## Business Guidelines for Barbers

### Choosing Your Radius

**Considerations**:
- **Travel time**: Can you realistically reach customers within your radius in acceptable time?
- **Transport**: Do you have reliable transportation for your chosen radius?
- **Fuel costs**: Larger radius = more fuel costs, factor into pricing
- **Competition**: Smaller radius = fewer customers but less travel; larger = more customers but more travel
- **Location density**: Urban areas may need smaller radius (high barber/customer density)

**Recommended Ranges**:
- **5 km**: Dense urban areas, walking/cycling distance
- **10 km**: Standard urban, short drives
- **15 km**: Suburban, willing to travel further
- **20 km**: Rural or high-earning bookings that justify travel

### Best Practices

1. **Start Conservative**: Begin with a smaller radius you're confident you can serve
2. **Monitor Performance**: Track travel time vs. job frequency
3. **Adjust Strategically**: Use the 24-hour window to test new radius
4. **Consider Peak Hours**: Can you maintain your radius during traffic?
5. **Customer Communication**: Be transparent about travel times in your profile

### Cooldown Strategy

Since you can only change once per 24 hours:
- **Plan ahead**: Don't change impulsively
- **Test periods**: Change on a Monday morning to test all week
- **Emergency**: Contact support if you genuinely need to change due to relocation or emergency

## Admin/Support Guidelines

### Handling Cooldown Bypass Requests

Barbers may request to bypass the cooldown in certain situations:

**Legitimate Reasons**:
- Permanent relocation (moved home)
- Vehicle breakdown (reducing radius)
- New transport acquired (increasing radius)
- Medical/emergency situations

**Process**:
1. Verify the reason and evidence
2. Manually update `last_radius_change_at` to null or old timestamp
3. Notify barber they can now change
4. Log the action for audit

**SQL** (admin only):
```sql
-- Reset cooldown for specific barber
UPDATE barbers
SET last_radius_change_at = NULL
WHERE id = 'barber_id_here';

-- Or set to 25 hours ago to allow immediate change
UPDATE barbers
SET last_radius_change_at = NOW() - INTERVAL '25 hours'
WHERE id = 'barber_id_here';
```

### Monitoring

**Metrics to Track**:
- Average service radius by region
- Frequency of radius changes per barber
- Cooldown bypass requests
- Customer-barber matching rates before/after radius changes

**Red Flags**:
- Barber constantly requesting cooldown bypass
- Very frequent changes (multiple bypass requests per week)
- Extreme radius swings (5km → 20km → 5km)

## Testing

### Unit Tests

Test `canChangeServiceRadius`:
- Never changed (null) → can change
- Just changed (< 24h) → cannot change
- Old change (>= 24h) → can change
- Edge case: exactly 24 hours

Test `updateServiceRadius`:
- Valid radius + cooldown expired → success
- Invalid radius (0, 21, -1, non-integer) → error
- Valid radius + cooldown active → error
- Non-existent barber → error

### Integration Tests

- Create barber → change radius → verify cooldown → wait 24h → change again
- Attempt to bypass cooldown via direct API call → rejected
- Verify timestamp updates correctly
- Verify customer searches respect new radius

### UI Tests

- Component displays current radius correctly
- Button disabled during cooldown
- Modal shows correct options
- Confirmation requires user action
- Success updates UI optimistically

## Future Enhancements

### Potential Improvements

1. **Dynamic Cooldown**: Shorter cooldown for new barbers (e.g., 12h for first week)
2. **Premium Feature**: Verified/premium barbers get more frequent changes
3. **Time-based Radius**: Different radius for different times of day (e.g., 10km weekdays, 20km weekends)
4. **Heatmap Analytics**: Show barbers where demand is high outside their current radius
5. **Smart Suggestions**: AI recommends optimal radius based on location, competition, and historical data
6. **Radius History**: Track changes over time for insights
7. **Temporary Radius**: Allow one-time temporary increase for special events

### Considerations

- Any enhancement should maintain the core principle: **stability and consistency for customers**
- Premium features should not create unfair advantages
- Data privacy: Don't expose individual barber radius to competitors

## Troubleshooting

### Common Issues

**Issue**: "Button always disabled, can't change radius"
- **Cause**: Cooldown timestamp may be in future due to clock skew
- **Fix**: Verify server time, check `last_radius_change_at` value

**Issue**: "Changed radius but not seeing more customers"
- **Cause**: May be few customers in extended area, or algorithm hasn't refreshed
- **Fix**: Wait 5-10 minutes for cache refresh, check customer density in area

**Issue**: "Component not appearing in profile"
- **Cause**: Not a freelance barber, or `serviceRadiusKm` is null
- **Fix**: Verify account type and database value

**Issue**: "Error updating radius"
- **Cause**: Database constraint violation or network error
- **Fix**: Check database constraints, verify network connectivity, check API logs

## Summary

The Service Radius Management system with 24-hour cooldown provides:
- **Flexibility** for barbers to define their service area
- **Stability** for customers through cooldown enforcement
- **Transparency** via clear UI and user guidelines
- **Scalability** via efficient database design and API

This system is essential for effective customer-barber matching and contributes to overall platform efficiency and user satisfaction.
