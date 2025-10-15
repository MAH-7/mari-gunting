# Address Selection Flow - Visual Guide

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BOOKING CONFIRMATION SCREEN                       │
│                     (/booking/create?barberId=123)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Has saved addresses?                                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│           │                                │                         │
│          YES                              NO                         │
│           │                                │                         │
│           ▼                                ▼                         │
│  ┌───────────────────┐          ┌──────────────────────┐           │
│  │ Show address list │          │  "No saved addresses"│           │
│  │ with radio buttons│          │   [+ Add Address]    │           │
│  └───────────────────┘          └──────────────────────┘           │
│           │                                │                         │
│    User selects                     User clicks button              │
│      existing                              │                         │
│     address ✓                              │                         │
│                                            ▼                         │
└────────────────────────────────────────────┼─────────────────────────┘
                                             │
                                             │ Navigate with params:
                                             │ fromBooking=true
                                             │ barberId=123
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ADDRESS MANAGEMENT SCREEN                         │
│          (/profile/addresses?fromBooking=true&barberId=123)         │
├─────────────────────────────────────────────────────────────────────┤
│  Header: "Select Address" (not "My Addresses")                      │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │ Address Card 1: Home                                       │     │
│  │ 123 Main St, City, State                                   │     │
│  │                                                             │     │
│  │  [Use This Address →]  ← Green button                      │     │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │ Address Card 2: Office                                     │     │
│  │ 456 Work Ave, City, State                                  │     │
│  │                                                             │     │
│  │  [Use This Address →]                                      │     │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                       │
│  User can:                                                           │
│  1. Click "Use This Address" on existing address                    │
│  2. Click "+" button to add new address                             │
│                                                                       │
└────────────────┬────────────────────────┬───────────────────────────┘
                 │                        │
      User clicks button          User clicks "+"
         on existing              to add new
                 │                        │
                 ▼                        ▼
       ┌──────────────────┐    ┌──────────────────────────┐
       │ Navigate back to │    │   Address Form Modal     │
       │ booking with:    │    │  - Enter details         │
       │                  │    │  - Pick on map (optional)│
       │ selectedAddressId│    │  - Save                  │
       └──────────────────┘    └──────────────────────────┘
                 │                        │
                 │                 When saved:
                 │              Auto-navigate back
                 │              with new address ID
                 │                        │
                 └────────┬───────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BOOKING CONFIRMATION SCREEN                       │
│        (/booking/create?returnFromAddresses=true&selectedAddressId)  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  useEffect detects returnFromAddresses=true                         │
│  → Auto-selects the address with selectedAddressId                  │
│  → Clears navigation params                                         │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ ● Home - 123 Main St ← Selected with radio button             │ │
│  │                                                                 │ │
│  │ ○ Office - 456 Work Ave                                        │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  User continues with booking flow...                                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Features

### 🎯 Context-Aware UI
- **Normal Mode**: Shows "My Addresses" + Edit/Delete actions
- **Booking Mode**: Shows "Select Address" + "Use This Address" buttons

### 🔄 Seamless Navigation
- Params preserve booking context (barberId)
- Auto-selection after address added
- No data loss during navigation

### 📍 Multiple Entry Points
1. **From Booking** → "Add Address" button
2. **From Profile** → Direct access to manage addresses
3. **From Map Picker** → Returns to address form

## User Experience Benefits

✅ **No friction** - One tap to use existing address
✅ **No confusion** - Clear "Use This Address" button
✅ **No manual work** - New addresses auto-selected
✅ **No lost context** - Booking state preserved throughout
