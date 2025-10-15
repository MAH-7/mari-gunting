# Service Radius Management - Testing Checklist

## Prerequisites
- [ ] Database schema updated (service_radius_km and last_radius_change_at columns added)
- [ ] Partner app running on device/emulator
- [ ] Logged in as a freelance barber account

## Test Cases

### 1. Component Visibility
- [ ] **Freelance Account**: Component appears at top of profile screen
- [ ] **Barbershop Account**: Component does NOT appear
- [ ] Current radius displays correctly (e.g., "10 km")
- [ ] Icon and styling look good

### 2. First-Time Change (No Cooldown)
- [ ] Click "Change Radius" button (should be enabled)
- [ ] Modal opens with 4 options (5km, 10km, 15km, 20km)
- [ ] Current radius is marked with "Current" badge
- [ ] Blue info banner shows "You can change this once every 24 hours"
- [ ] Select a different radius (e.g., change from 10km to 15km)
- [ ] Click "Save Change"
- [ ] Confirmation dialog appears warning about 24-hour cooldown
- [ ] Click "Confirm"
- [ ] Success alert appears
- [ ] Modal closes
- [ ] UI updates to show new radius (15 km)
- [ ] "Last changed" timestamp appears (e.g., "Just now")

### 3. Cooldown Active (Within 24 Hours)
- [ ] Button shows "Wait Xh" and is disabled (grey)
- [ ] Click the disabled button
- [ ] Alert appears explaining cooldown with hours remaining
- [ ] Cannot open modal

### 4. Cooldown Expired (After 24 Hours)
- [ ] Wait 24 hours OR manually update database to simulate:
  ```sql
  UPDATE barbers 
  SET last_radius_change_at = NOW() - INTERVAL '25 hours'
  WHERE id = 'your_barber_id';
  ```
- [ ] Refresh profile screen
- [ ] Button shows "Change Radius" and is enabled again
- [ ] Can change radius again

### 5. Edge Cases
- [ ] Try changing to same radius → Modal closes without saving
- [ ] Network error during save → Error message appears
- [ ] Cancel button in modal works
- [ ] Cancel during confirmation works
- [ ] Loading spinners appear during API calls

### 6. Visual Polish
- [ ] All text is readable
- [ ] Colors match app theme
- [ ] Animations are smooth
- [ ] Modal slides up from bottom
- [ ] Icons display correctly
- [ ] No layout overflow or clipping

## Manual Database Testing

### Check Current State
```sql
SELECT 
  id,
  user_id,
  service_radius_km,
  last_radius_change_at,
  created_at
FROM barbers
WHERE user_id = 'your_user_id';
```

### Simulate Cooldown Expired
```sql
UPDATE barbers 
SET last_radius_change_at = NOW() - INTERVAL '25 hours'
WHERE user_id = 'your_user_id';
```

### Reset Cooldown (Admin)
```sql
UPDATE barbers 
SET last_radius_change_at = NULL
WHERE user_id = 'your_user_id';
```

### View All Radius Changes (Future: Add History Table)
```sql
SELECT 
  user_id,
  service_radius_km,
  last_radius_change_at,
  (NOW() - last_radius_change_at) as time_since_change
FROM barbers
WHERE last_radius_change_at IS NOT NULL
ORDER BY last_radius_change_at DESC;
```

## Bug Reports Template

If you find issues, document:
- **What happened**: Describe the bug
- **Expected behavior**: What should happen
- **Steps to reproduce**: Detailed steps
- **Screenshots**: If applicable
- **Console logs**: Check React Native debugger
- **Database state**: Query the barbers table

## Common Issues & Fixes

### Component Not Appearing
**Cause**: Account type not "freelance" or serviceRadiusKm is null
**Fix**: 
```sql
-- Check account type
SELECT account_type FROM profiles WHERE id = 'your_user_id';

-- Check radius value
SELECT service_radius_km FROM barbers WHERE user_id = 'your_user_id';
```

### Button Always Disabled
**Cause**: Cooldown check failing or timestamp in future
**Fix**: Check API logs and database timestamp

### Error Updating Radius
**Cause**: Database constraint violation or missing columns
**Fix**: Verify database schema is up to date

## Success Criteria

✅ All test cases pass
✅ No console errors
✅ Smooth user experience
✅ Database updates correctly
✅ Cooldown enforced properly
✅ Visual design matches app theme
