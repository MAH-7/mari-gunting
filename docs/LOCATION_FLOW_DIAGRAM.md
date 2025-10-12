# 📊 Location Permission Flow - Visual Diagram

## 🎯 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER OPENS APP                               │
│                  (First time / No permission)                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   Check Permission   │
                 │       Status         │
                 └──────────┬───────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
      ┌─────────────┐ ┌──────────┐ ┌──────────┐
      │   GRANTED   │ │ BLOCKED  │ │NOT-ASKED │
      └─────────────┘ └──────────┘ └──────────┘
              │             │             │
              │             │             ▼
              │             │    ┌─────────────────┐
              │             │    │ Wait 2 seconds  │
              │             │    └────────┬────────┘
              │             │             │
              │             │             ▼
              │             │    ┌─────────────────────────┐
              │             │    │ Show Permission Modal   │
              │             │    │                         │
              │             │    │  📍 Enable Location     │
              │             │    │  🗺️  Use Saved Address  │
              │             │    │  ⏭️  Maybe Later        │
              │             │    └────────┬────────────────┘
              │             │             │
              │             │    ┌────────┼────────┐
              │             │    │        │        │
              │             │    ▼        ▼        ▼
              │             │  ┌────┐ ┌────┐  ┌─────┐
              │             │  │ 1  │ │ 2  │  │  3  │
              │             │  └─┬──┘ └─┬──┘  └──┬──┘
              │             │    │      │        │
              │             │    │      │        │
              ▼             ▼    ▼      ▼        ▼
      ┌─────────────────────────────────────────────────┐
      │                 OPTION 1: Enable Location        │
      └──────────────────────────┬──────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ System Permission      │
                    │ Dialog Appears         │
                    └────────┬───────────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  ▼                     ▼
          ┌───────────┐         ┌───────────┐
          │  ALLOW    │         │  DENY     │
          └─────┬─────┘         └─────┬─────┘
                │                     │
                ▼                     ▼
        ┌───────────────┐     ┌──────────────┐
        │ ✅ GRANTED    │     │ Denial Count │
        │               │     │ Incremented  │
        │ • Save state  │     │              │
        │ • Enable      │     │ if count ≥ 3 │
        │   features    │     │ → BLOCKED    │
        │ • Close modal │     │              │
        └───────────────┘     └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ Close modal  │
                              │ Set cooldown │
                              │ (24 hours)   │
                              └──────────────┘

      ┌─────────────────────────────────────────────────┐
      │            OPTION 2: Use Saved Address           │
      └──────────────────────────┬──────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Navigate to            │
                    │ /profile/addresses     │
                    └────────┬───────────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  ▼                     ▼
        ┌──────────────────┐   ┌──────────────────┐
        │ Has Addresses    │   │ No Addresses     │
        └────────┬─────────┘   └────────┬─────────┘
                 │                      │
                 ▼                      ▼
        ┌──────────────┐       ┌───────────────┐
        │ Select one   │       │ Add new       │
        │ • Home       │       │ address       │
        │ • Office     │       │               │
        │ • Other      │       │ Fill form:    │
        └──────┬───────┘       │ • Label       │
               │               │ • Address     │
               │               │ • City        │
               │               │ • State       │
               │               │ • Postal      │
               │               └───────┬───────┘
               │                       │
               └───────────┬───────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │ ✅ Address    │
                   │    Saved      │
                   │               │
                   │ Use for       │
                   │ location      │
                   │ context       │
                   └───────────────┘

      ┌─────────────────────────────────────────────────┐
      │               OPTION 3: Maybe Later              │
      └──────────────────────────┬──────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Close Modal            │
                    │                        │
                    │ • Save timestamp       │
                    │ • Set 24h cooldown     │
                    │ • User can still       │
                    │   use app              │
                    └────────────────────────┘
```

---

## 🔄 Permission State Machine

```
┌─────────────────────────────────────────────────────┐
│                 PERMISSION STATES                    │
└─────────────────────────────────────────────────────┘

NOT-ASKED ──────────[Allow]────────────> GRANTED
    │                                        │
    │                                        │
    └───────[Deny (1-2x)]──────> DENIED ────┘
                                    │
                                    │
                         [Deny 3+ times]
                                    │
                                    ▼
                                BLOCKED
                                    │
                                    │
                          [Manual: Go to Settings]
                                    │
                                    │
                                    ▼
                                GRANTED
```

---

## 📱 Screen Flow

```
┌────────────────────────────────────────────────────────┐
│                    HOME SCREEN                          │
│  ┌─────────────────────────────────────┐               │
│  │  Profile | Points  🌟 1,234          │               │
│  └─────────────────────────────────────┘               │
│                                                         │
│  ┌─────────────────────────────────────┐               │
│  │                                     │               │
│  │         Promo Banner                │               │
│  │                                     │               │
│  └─────────────────────────────────────┘               │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │  Freelance   │  │  Barbershop  │                   │
│  └──────────────┘  └──────────────┘                   │
│                                                         │
│  ┌─────────────────────────────────────┐               │
│  │  📍 Location Permission Modal       │ ← Slides up   │
│  │                                     │               │
│  │  [Icon with pulse]                  │               │
│  │                                     │               │
│  │  Enable Location Access             │               │
│  │                                     │               │
│  │  Help us find the best barbers      │               │
│  │  near you...                        │               │
│  │                                     │               │
│  │  ✓ Find nearby barbers              │               │
│  │  ✓ Get directions & ETAs            │               │
│  │  ✓ Accurate pricing                 │               │
│  │                                     │               │
│  │  🔒 Only used while using app       │               │
│  │                                     │               │
│  │  ┌─────────────────────────────┐   │               │
│  │  │  📍 Enable Location         │   │ ← Primary     │
│  │  └─────────────────────────────┘   │               │
│  │                                     │               │
│  │  ┌─────────────────────────────┐   │               │
│  │  │  🗺️  Use Saved Address      │   │ ← Secondary   │
│  │  └─────────────────────────────┘   │               │
│  │                                     │               │
│  │      Maybe Later                    │ ← Tertiary    │
│  │                                     │               │
│  └─────────────────────────────────────┘               │
└────────────────────────────────────────────────────────┘
```

---

## 🗺️  Address Screen (Fallback)

```
┌────────────────────────────────────────────────────────┐
│  ← My Addresses                              ➕        │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────────────────────────────────────┐        │
│  │  📍 Home                      [Default]     │        │
│  │                                             │        │
│  │  123 Main Street, Apt 4                     │        │
│  │  Kuala Lumpur, WP 50100                     │        │
│  │                                             │        │
│  │  [✓ Set Default] [✏️ Edit] [🗑️ Delete]     │        │
│  └────────────────────────────────────────────┘        │
│                                                         │
│  ┌────────────────────────────────────────────┐        │
│  │  📍 Office                                  │        │
│  │                                             │        │
│  │  456 Business Ave                           │        │
│  │  Petaling Jaya, Selangor 46000              │        │
│  │                                             │        │
│  │  [✓ Set Default] [✏️ Edit] [🗑️ Delete]     │        │
│  └────────────────────────────────────────────┘        │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## ⏱️  Timeline Flow

```
T = 0s      User opens app
              │
T = 2s      Permission modal slides up
              │
              ├─> User clicks "Enable" → System dialog (T = 3s)
              │                              │
              │                              ├─> Allow → GRANTED ✅
              │                              └─> Deny → DENIED (count +1)
              │
              ├─> User clicks "Use Address" → Navigate to addresses
              │
              └─> User clicks "Maybe Later" → Modal dismissed
                                                │
                                                └─> Cooldown starts (24h)
```

---

## 🎯 Success Metrics

```
┌─────────────────────────────────────────────────────────┐
│                   USER JOURNEY                           │
│                                                          │
│  100 Users Open App                                     │
│       │                                                  │
│       ├─> 70% Click "Enable Location"                   │
│       │        │                                         │
│       │        ├─> 90% Allow → 63 Users Granted ✅      │
│       │        └─> 10% Deny → 7 Users Denied           │
│       │                                                  │
│       ├─> 25% Click "Use Address"                       │
│       │        │                                         │
│       │        └─> 100% Add Address → 25 Users OK ✅    │
│       │                                                  │
│       └─> 5% Click "Maybe Later" → 5 Users Skip         │
│                                                          │
│  TOTAL SUCCESS: 88% have location context               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Components

```
┌──────────────────────────────────────────────────┐
│  useLocationPermission Hook                       │
│  ─────────────────────────────                   │
│  • Check permission status                        │
│  • Request permission                             │
│  • Track denials                                  │
│  • Manage cooldown                                │
│  • Store in AsyncStorage                          │
└──────────────────────────────────────────────────┘
                    ▼
┌──────────────────────────────────────────────────┐
│  LocationPermissionModal                          │
│  ───────────────────────────                      │
│  • Beautiful UI                                   │
│  • Three action buttons                           │
│  • Smooth animations                              │
│  • Value proposition                              │
└──────────────────────────────────────────────────┘
                    ▼
┌──────────────────────────────────────────────────┐
│  Home Screen Integration                          │
│  ────────────────────────                         │
│  • Show after 2s delay                            │
│  • Handle permission callbacks                    │
│  • Navigate to addresses                          │
│  • Close modal                                    │
└──────────────────────────────────────────────────┘
                    ▼
┌──────────────────────────────────────────────────┐
│  Address Management (Fallback)                    │
│  ──────────────────────────────                   │
│  • List saved addresses                           │
│  • Add new address                                │
│  • Set default                                    │
│  • Use for location context                       │
└──────────────────────────────────────────────────┘
```

---

## 📊 Data Persistence

```
AsyncStorage Keys:
├─ @location_permission_asked       → Boolean
├─ @location_permission_denied_count → Number (0-3)
├─ @location_last_asked_timestamp   → Timestamp
└─ @location_user_manually_denied   → Boolean
```

---

**This visual diagram provides a complete overview of your location permission system!** 🎨
