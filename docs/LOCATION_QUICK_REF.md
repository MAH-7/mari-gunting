# 📋 Location Permission - Quick Reference Card

## 🚀 Quick Start

### Test the Feature:
```bash
1. npx expo start
2. Scan QR code with phone
3. Login to app
4. Wait 2 seconds → Modal appears!
5. Test all 3 buttons
```

---

## 📱 Three User Options

| Button | Action | Result |
|--------|--------|--------|
| 🎯 **Enable Location** | System permission dialog | Location enabled or denied |
| 🗺️  **Use Saved Address** | Navigate to `/profile/addresses` | User picks/adds address |
| ⏭️  **Maybe Later** | Dismiss modal | Cooldown 24h |

---

## 🎛️  Permission States

| State | What It Means | Next Action |
|-------|---------------|-------------|
| `not-asked` | First time user | Show modal |
| `granted` | User allowed | Use location ✅ |
| `denied` | Declined 1-2x | Ask again after 24h |
| `blocked` | Denied 3+ times | Show settings only |

---

## 🗂️  Files You Need to Know

```
apps/customer/
├─ hooks/
│  └─ useLocationPermission.ts       ← Hook logic
├─ components/
│  └─ LocationPermissionModal.tsx    ← Modal UI
├─ app/
│  ├─ (tabs)/
│  │  └─ index.tsx                   ← Integration
│  └─ profile/
│     └─ addresses.tsx               ← Fallback screen
└─ app.json                          ← Permissions config
```

---

## 🔧 Common Code Snippets

### Use the Hook:
```typescript
import { useLocationPermission } from '@/hooks/useLocationPermission';

const {
  status,                      // 'granted' | 'denied' | 'not-asked' | 'blocked'
  requestPermission,           // Ask for permission
  shouldShowPermissionPrompt,  // Check if should show modal
  openSettings,                // Open device settings
  resetPermissionState,        // Reset for testing
} = useLocationPermission();
```

### Show the Modal:
```typescript
import { LocationPermissionModal } from '@/components/LocationPermissionModal';

<LocationPermissionModal
  visible={showModal}
  onRequestPermission={handleRequestPermission}
  onManualLocation={() => router.push('/profile/addresses')}
  onDismiss={handleDismiss}
/>
```

### Check Permission:
```typescript
useEffect(() => {
  const checkAndShow = async () => {
    const shouldShow = await shouldShowPermissionPrompt();
    if (shouldShow) {
      setTimeout(() => setShowModal(true), 2000);
    }
  };
  checkAndShow();
}, []);
```

### Reset for Testing:
```typescript
const { resetPermissionState } = useLocationPermission();
await resetPermissionState(); // Clears all stored state
```

---

## ⏱️  Timing Rules

| Event | Delay | Why |
|-------|-------|-----|
| Modal shows | 2 seconds after app open | Not too aggressive |
| Cooldown after deny | 24 hours | Don't nag users |
| Blocked after denies | 3 times | Respect choice |

---

## 🎨 UI Elements

```
┌─────────────────────────────────┐
│  📍 [Pulse Icon]                │
│                                 │
│  Enable Location Access         │
│  Help us find nearby barbers... │
│                                 │
│  ✓ Find nearby barbers          │
│  ✓ Get directions & ETAs        │
│  ✓ Accurate pricing             │
│                                 │
│  🔒 Only used while using app   │
│                                 │
│  [📍 Enable Location]  ← Green  │
│  [🗺️  Use Saved Address]  ← Gray │
│  Maybe Later           ← Text   │
└─────────────────────────────────┘
```

---

## 🎯 When to Ask for Location

### ✅ GOOD Times:
- After 2s on first app open
- When viewing barbers list
- When trying to book
- In settings (user-initiated)

### ❌ BAD Times:
- Immediately on app open
- During registration
- Too frequently

---

## 🗃️  AsyncStorage Keys

```typescript
@location_permission_asked         // Has ever been asked
@location_permission_denied_count  // How many times denied (0-3)
@location_last_asked_timestamp     // When last asked
@location_user_manually_denied     // User explicitly denied
```

---

## 🔍 Debugging

### Modal not showing?
```typescript
// Check these:
console.log('Status:', status);
console.log('Should show:', await shouldShowPermissionPrompt());

// Common reasons:
// - Already granted
// - Asked in last 24h
// - Blocked (3+ denials)
```

### Permission always denied?
```bash
# iOS:
- Open Settings → Privacy → Location → [Your App]
- Delete app and reinstall

# Android:
- Settings → Apps → [Your App] → Permissions
- Delete app and reinstall
```

### Reset everything:
```typescript
await resetPermissionState();
// Then reload app
```

---

## 📊 Expected Behavior

### First Time User:
```
1. Opens app
2. Waits 2 seconds
3. Sees modal
4. Clicks one of 3 buttons
5. Gets location OR uses address
```

### Returning User (Granted):
```
1. Opens app
2. No modal (already has permission)
3. Location works automatically ✅
```

### Returning User (Denied):
```
1. Opens app
2. No modal (respects cooldown)
3. Can enable in settings if needed
4. Can use saved address as fallback
```

---

## 🚨 Error Handling

All errors are handled gracefully:
- ✅ Permission denied → Track and cooldown
- ✅ Settings won't open → Show alert
- ✅ AsyncStorage fails → Log error, continue
- ✅ Unknown error → Console log, don't crash

---

## 📈 Success Metrics

Target KPIs:
- **60-70%** permission acceptance rate
- **88%** users have location context (granted + address)
- **<10%** "Maybe Later" rate

---

## 🎓 Best Practices

1. ✅ Show value before asking
2. ✅ Provide fallback (saved address)
3. ✅ Don't block entire app
4. ✅ Respect user choice
5. ✅ Use 24h cooldown
6. ✅ Max 3 denial attempts
7. ✅ Deep-link to settings
8. ✅ Non-intrusive UI

---

## 📞 Quick Commands

```bash
# Start development
npx expo start

# Reset app data (iOS)
xcrun simctl erase all

# Reset app data (Android)
adb shell pm clear com.marigunting.app

# View logs
npx react-native log-ios
npx react-native log-android
```

---

## 🔗 Related Docs

- **Complete Guide**: `LOCATION_PERMISSION_GUIDE.md`
- **Flow Diagram**: `LOCATION_FLOW_DIAGRAM.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`

---

## ✅ Checklist for New Developers

- [ ] Read this quick reference
- [ ] Test modal on your device
- [ ] Try all 3 button options
- [ ] Test deny → grant flow
- [ ] Test reset function
- [ ] Check AsyncStorage keys
- [ ] Review permission states
- [ ] Understand 24h cooldown
- [ ] Know where addresses screen is
- [ ] Can debug common issues

---

**Everything you need to know about the location permission system in one place!** 🎯
