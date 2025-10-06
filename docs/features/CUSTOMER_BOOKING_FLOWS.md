# Customer Booking Flows - Mari Gunting
**Complete User Journey Explanation**

---

## 🎯 Overview

Your app has **3 distinct booking methods** for customers, each serving different use cases:

1. **🚀 Quick Book** - Fastest, automated barber matching
2. **👤 Choose Barber (Freelance)** - Customer browses and selects freelance barber
3. **🏢 Barbershop** - Customer books at physical barbershop location

---

## 📱 Entry Points (Home Screen)

**File**: `app/(tabs)/index.tsx`

Customer lands on **Home Screen** and sees 2 main action buttons:

```
┌─────────────────────────────────┐
│  Profile + Points               │
├─────────────────────────────────┤
│  [Promotional Banners]          │
│  (Auto-scroll carousel)         │
├─────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐    │
│  │ 👤 Freelance│ │🏢Barbershop│ │
│  └──────────┘  └──────────┘    │
└─────────────────────────────────┘
```

**Actions**:
- **"Freelance" button** → Navigates to `/barbers` (Freelance barber list)
- **"Barbershop" button** → Navigates to `/barbershops` (Barbershop list)

---

## 🚀 Flow 1: Quick Book (ASAP Service)

### **Use Case**: Customer needs barber **RIGHT NOW**, wants fastest booking

### **Journey Flow**:

```
Home Screen
    ↓ (User accesses Quick Book - not visible on current home, likely from menu/elsewhere)
    ↓
Quick Book Screen (/quick-book.tsx)
    ↓ (Set preferences: radius, max price)
    ↓ (Click "Find Barber Now")
    ↓ [System searches for available barber]
    ↓
Booking Create Screen (/booking/create.tsx?barberId=XXX)
    ↓ (Select services & address)
    ↓ (Click "Book Now")
    ↓
Payment Method Screen (/payment-method)
    ↓ (Select payment method)
    ↓
✅ Booking Confirmed!
```

---

### **Detailed Step-by-Step**:

#### **Step 1: Quick Book Setup Screen**
**File**: `app/quick-book.tsx`

**What Customer Sees**:
```
┌─────────────────────────────────┐
│  ← Quick Book                   │
├─────────────────────────────────┤
│  ⚡ Quick Book                   │
│  Find nearest available barber  │
│  instantly                       │
│                                  │
│  🕐 Fast Match                   │
│  📍 Nearby                       │
│  💰 Best Price                   │
├─────────────────────────────────┤
│  Search Radius        [5 km]    │
│  ━━━━━━○━━━━━━━ (slider)        │
│  1 km              20 km        │
│  👥 ~17 barbers available       │
├─────────────────────────────────┤
│  Maximum Price      [RM 50]     │
│  ━━━━━━○━━━━━━━ (slider)        │
│  RM 10           RM 200         │
│  ℹ️ Final price may vary        │
├─────────────────────────────────┤
│  ✓ Ready to Find Barber         │
│  ASAP | 5km | RM50 | ~17       │
│  ℹ️ Service selection after     │
│     barber is matched           │
└─────────────────────────────────┘
│  ⚡ Find Barber Now              │
└─────────────────────────────────┘
```

**Customer Actions**:
1. Adjust **Search Radius** (1-20 km) - how far to search
2. Set **Maximum Price** (RM 10-200) - budget limit
3. See estimate of available barbers
4. Click **"Find Barber Now"** button

**What Happens Next**:
- Shows searching overlay for 2 seconds (simulated)
- Calls `api.quickBook('any', 'now')` with radius and maxPrice
- System automatically finds nearest available barber
- If barber found → Navigate to booking creation
- If no barber found → Show error modal

---

#### **Step 2: Barber Matched - Booking Creation**
**File**: `app/booking/create.tsx?barberId=XXX`

**What Customer Sees**:
```
┌─────────────────────────────────┐
│  ← Confirm Booking              │
├─────────────────────────────────┤
│  ⚡ On-Demand Service            │
│  Your barber will arrive at     │
│  your location ASAP             │
├─────────────────────────────────┤
│  Barber                         │
│  ┌────────────────────────────┐│
│  │ [Avatar] Ahmad Razak ✓    ││
│  │          ⭐ 4.8 (156)     ││
│  └────────────────────────────┘│
├─────────────────────────────────┤
│  Select Services        2 selected│
│  ☑ Haircut               RM 25  │
│  ☑ Beard Trim            RM 15  │
│  ☐ Hair Treatment        RM 80  │
├─────────────────────────────────┤
│  Service Location               │
│  ⦿ Home (Default)              │
│  ○ Office - KLCC               │
│  + Add New Address             │
├─────────────────────────────────┤
│  Service Details                │
│  📅 ASAP (On-demand)           │
│  ⏱️ Total duration: 40 min     │
│  📍 Distance: ~3.5 km          │
├─────────────────────────────────┤
│  Payment Summary                │
│  Services         RM 40.00      │
│  Travel Cost      RM  5.00      │
│  Platform Fee     RM  2.00      │
│  ─────────────────────────      │
│  Total           RM 47.00      │
└─────────────────────────────────┘
│  💰 Book Now - RM 47.00         │
└─────────────────────────────────┘
```

**Customer Actions**:
1. **Select Services** - Check boxes for desired services
2. **Choose Address** - Where barber should come to
3. Review automatic calculations (travel cost based on distance)
4. Click **"Book Now"** button

**Key Features**:
- **Service is ASAP/On-demand** (no date/time selection)
- **Travel cost calculated**: RM 5 base (0-4km) + RM 1/km after 4km
- **Platform fee**: RM 2.00 fixed
- **Barber comes to customer location** (not walk-in)

---

#### **Step 3: Payment & Confirmation**
**File**: `app/payment-method.tsx`

Customer selects payment method → Booking created → Success!

---

## 👤 Flow 2: Choose Barber (Freelance)

### **Use Case**: Customer wants to **browse and choose** specific freelance barber

### **Journey Flow**:

```
Home Screen
    ↓ (Click "Freelance" button)
    ↓
Barbers List Screen (/barbers.tsx)
    ↓ (Browse, filter, sort barbers)
    ↓ (Click on a barber card)
    ↓
Barber Profile Screen (/barber/[id].tsx)
    ↓ (View details, reviews, photos)
    ↓ (Click "Book Now")
    ↓
Booking Create Screen (/booking/create.tsx?barberId=XXX)
    ↓ (Select services & address)
    ↓ (Click "Book Now")
    ↓
Payment Method Screen (/payment-method)
    ↓ (Select payment method)
    ↓
✅ Booking Confirmed!
```

---

### **Detailed Step-by-Step**:

#### **Step 1: Browse Barbers List**
**File**: `app/barbers.tsx`

**What Customer Sees**:
```
┌─────────────────────────────────┐
│  ← Available Barbers            │
├─────────────────────────────────┤
│  📍 Within 5km from you  Change │
├─────────────────────────────────┤
│  4 available barbers ⇅ Sort    │
├─────────────────────────────────┤
│  ┌────────────────────────────┐│
│  │ [Photo] Ahmad Razak ✓     ││
│  │         ⭐ 4.8 • 156 jobs  ││
│  │         📍 2.3km away       ││
│  │         From RM 25          ││
│  │         [Available] 🟢     ││
│  └────────────────────────────┘│
│  ┌────────────────────────────┐│
│  │ [Photo] Hafiz Ibrahim      ││
│  │         ⭐ 4.9 • 203 jobs   ││
│  │         📍 3.1km away       ││
│  │         From RM 30          ││
│  │         [Available] 🟢     ││
│  └────────────────────────────┘│
└─────────────────────────────────┘
```

**Customer Actions**:
1. **Change radius** - Adjust search distance (5, 10, 15, 20 km)
2. **Sort barbers**:
   - Nearest first (default)
   - Price: Low to High
   - Price: High to Low
3. **Browse cards** - Scroll through available barbers
4. **Click on barber card** - View detailed profile

**Features Shown Per Card**:
- Avatar photo
- Name + Verification badge ✓
- Rating & completed jobs
- Distance from user
- Starting price
- Online/Available status

---

#### **Step 2: View Barber Profile**
**File**: `app/barber/[id].tsx`

**What Customer Sees**:
```
┌─────────────────────────────────┐
│  ← Barber Profile          Share│
├─────────────────────────────────┤
│  [Avatar Photo]  Ahmad Razak ✓  │
│                 ⭐ 4.8 (156)    │
│                 📍 2.3km away    │
│                 [Available Now]🟢│
├─────────────────────────────────┤
│  🎯 203 Jobs | ⏱️ Since 2022   │
│  ⭐ 4.8 Rating                  │
├─────────────────────────────────┤
│  About                          │
│  Professional barber with 5+    │
│  years experience...            │
├─────────────────────────────────┤
│  Specializations                │
│  [Haircut] [Beard] [Modern]    │
├─────────────────────────────────┤
│  Portfolio                      │
│  [Photo1] [Photo2] [Photo3]    │
├─────────────────────────────────┤
│  Services & Pricing             │
│  Haircut           RM 25  30min │
│  Beard Trim        RM 15  15min │
│  Hair Treatment    RM 80  45min │
├─────────────────────────────────┤
│  Customer Reviews               │
│  [Review cards...]              │
│  View all 156 reviews →        │
└─────────────────────────────────┘
│  From RM 25  [Book Now →]      │
└─────────────────────────────────┘
```

**Customer Actions**:
1. **View profile** - Read about barber, experience
2. **See portfolio** - View work photos
3. **Check services** - Review prices and duration
4. **Read reviews** - See customer feedback
5. Click **"Book Now"** - Proceed to booking

---

#### **Step 3: Create Booking**
**File**: `app/booking/create.tsx?barberId=XXX`

*Same as Quick Book Step 2* - Select services, address, review pricing

**Key Differences from Quick Book**:
- Customer **chose specific barber** (not auto-matched)
- More time to browse and decide
- Still ASAP/on-demand service
- Barber comes to customer location

---

## 🏢 Flow 3: Barbershop Booking

### **Use Case**: Customer wants to **visit a physical barbershop** for service

### **Journey Flow**:

```
Home Screen
    ↓ (Click "Barbershop" button)
    ↓
Barbershops List Screen (/barbershops.tsx)
    ↓ (Browse, filter shops)
    ↓ (Click on a shop card)
    ↓
Barbershop Detail Screen (/barbershop/[id].tsx)
    ↓ (View details, services, reviews)
    ↓ (Click "Book Now")
    ↓
Select Barber Screen (/barbershop/barbers/[shopId].tsx)
    ↓ (Choose barber from shop)
    ↓ (Click "Select")
    ↓
Barbershop Booking Screen (/barbershop/booking/[barberId].tsx)
    ↓ (Select services, date, time)
    ↓ (Click "Book Now")
    ↓
Payment Method Screen (/payment-method)
    ↓ (Select payment method)
    ↓
✅ Booking Confirmed!
```

---

### **Detailed Step-by-Step**:

#### **Step 1: Browse Barbershops List**
**File**: `app/barbershops.tsx`

**What Customer Sees**:
```
┌─────────────────────────────────┐
│  ← Barbershops            🎛️    │
├─────────────────────────────────┤
│  🏪 4 shops available           │
├─────────────────────────────────┤
│  ┌────────────────────────────┐│
│  │ [Logo] Cut & Style ✓       ││
│  │        ⭐ 4.7 • 234 reviews ││
│  │        📍 1.8km             ││
│  │        ⏰ 9:00AM-9:00PM 🟢  ││
│  │        👥 500+ bookings     ││
│  │        [Haircut][Beard][Spa]│
│  │        From RM 20 [Book→]  ││
│  └────────────────────────────┘│
│  ┌────────────────────────────┐│
│  │ [Logo] Premium Cuts        ││
│  │        ⭐ 4.9 • 456 reviews ││
│  │        📍 2.5km  [Closed🔴] ││
│  └────────────────────────────┘│
└─────────────────────────────────┘
```

**Customer Actions**:
1. **Filter shops**:
   - Distance (5, 10, 15, 20 km)
   - Price range (Budget, Mid, Premium)
   - Open now
   - Verified only
2. **Browse shops** - Scroll through list
3. **Click shop card** - View details

**Features Shown Per Card**:
- Shop logo
- Name + Verification badge ✓
- Rating & review count
- Distance
- Operating hours + Open/Closed status
- Number of bookings
- Service preview pills (Haircut, Beard, Spa)
- Starting price
- "Book" button

---

#### **Step 2: View Barbershop Details**
**File**: `app/barbershop/[id].tsx`

**What Customer Sees**:
```
┌─────────────────────────────────┐
│  [Hero Image - Shop Interior]   │
│  ← Back                  Share  │
├─────────────────────────────────┤
│  [Logo] Cut & Style ✓           │
│         ⭐ 4.7 (234 reviews)    │
│         📍 1.8km                │
│         [Open] 🟢              │
├─────────────────────────────────┤
│  ⭐ 4.7    👥 500+    📅 2020   │
│  Rating   Bookings  Established│
├─────────────────────────────────┤
│  📍 Address                     │
│  Jalan Sultan Ismail, Kuala     │
│  Lumpur 50250                   │
│  [Get Directions →]            │
├─────────────────────────────────┤
│  ℹ️ About This Barbershop       │
│  Modern barbershop with         │
│  professional barbers...        │
├─────────────────────────────────┤
│  ⏰ Operating Hours              │
│  Monday    9:00 AM - 9:00 PM ✓  │
│  Tuesday   9:00 AM - 9:00 PM    │
│  Wednesday 9:00 AM - 9:00 PM    │
│  ...                            │
├─────────────────────────────────┤
│  💈 Services                     │
│  Haircut           RM 25  30min │
│  Beard Styling     RM 20  20min │
│  Hair Treatment    RM 80  45min │
│  Kids Haircut      RM 18  25min │
├─────────────────────────────────┤
│  ⭐ Customer Reviews             │
│  [Review cards...]              │
│  View all 234 reviews →        │
└─────────────────────────────────┘
│  From RM 20  [Book Now →]      │
└─────────────────────────────────┘
```

**Customer Actions**:
1. **View shop info** - Photos, description, address
2. **Check hours** - Operating schedule
3. **See services** - Available services & pricing
4. **Read reviews** - Customer feedback
5. Click **"Book Now"** - Proceed to barber selection

---

#### **Step 3: Select Barber from Shop**
**File**: `app/barbershop/barbers/[shopId].tsx`

**What Customer Sees**:
```
┌─────────────────────────────────┐
│  ← Select Your Barber           │
├─────────────────────────────────┤
│  [Logo] Cut & Style             │
│         ⭐ 4.7 • 6 barbers       │
├─────────────────────────────────┤
│  Available Barbers              │
│  Choose your preferred barber   │
├─────────────────────────────────┤
│  ┌────────────────────────────┐│
│  │ [Photo] Ahmad ✓ [Online🟢] ││
│  │         ⭐ 4.8 (123)        ││
│  │         203 jobs completed  ││
│  │         [Available Now]     ││
│  │ [Modern] [Fade] [Beard]    ││
│  │ From RM 25  [Select →]     ││
│  └────────────────────────────┘│
│  ┌────────────────────────────┐│
│  │ [Photo] Hafiz [Offline]    ││
│  │         ⭐ 4.9 (156)        ││
│  │         289 jobs completed  ││
│  │ [Haircut] [Beard] [Spa]    ││
│  │ From RM 30  [Select →]     ││
│  └────────────────────────────┘│
└─────────────────────────────────┘
```

**Customer Actions**:
1. **View barbers** - See all barbers working at shop
2. **Check availability** - Online/Offline status
3. **Review expertise** - Specializations
4. **See stats** - Rating, jobs completed
5. Click **"Select"** - Choose barber and proceed

**Features Shown Per Barber**:
- Avatar photo
- Name + Verification
- Online/Offline status
- Rating & review count
- Jobs completed
- Specializations (pills)
- Starting price
- "Select" button

---

#### **Step 4: Barbershop Booking Details**
**File**: `app/barbershop/booking/[barberId].tsx?shopId=XXX`

**What Customer Sees**:
```
┌─────────────────────────────────┐
│  ← Confirm Booking              │
├─────────────────────────────────┤
│  🏪 Barbershop Visit            │
│  Visit the shop at your         │
│  scheduled time for service     │
├─────────────────────────────────┤
│  Barbershop                     │
│  [Image] Cut & Style ✓          │
│  📍 Jalan Sultan Ismail, KL     │
│  [Get Directions →]            │
├─────────────────────────────────┤
│  Barber                         │
│  [Avatar] Ahmad Razak ✓         │
│  ⭐ 4.8 (123 reviews)           │
├─────────────────────────────────┤
│  Select Services        2 selected│
│  ☑ Haircut               RM 25  │
│  ☑ Beard Trim            RM 15  │
│  ☐ Hair Treatment        RM 80  │
├─────────────────────────────────┤
│  Select Date                    │
│  [Today] [Tue] [Wed] [Thu]...  │
│   8 Dec   9 Dec 10 Dec 11 Dec  │
├─────────────────────────────────┤
│  Select Time                    │
│  [9:00AM] [9:30AM] [10:00AM]   │
│  [10:30AM] [11:00AM] [11:30AM] │
│  ...                            │
├─────────────────────────────────┤
│  Service Details                │
│  📅 Wed, 10 Dec 2025           │
│  ⏰ 2:30 PM                     │
│  ⏱️ Total duration: 40 min     │
├─────────────────────────────────┤
│  Payment Summary                │
│  Services         RM 40.00      │
│  Travel Cost      RM  0.00 ❌   │
│  Platform Fee     RM  2.00      │
│  ─────────────────────────      │
│  Total           RM 42.00      │
└─────────────────────────────────┘
│  💰 Book Now - RM 42.00         │
└─────────────────────────────────┘
```

**Customer Actions**:
1. **Select Services** - Choose services needed
2. **Pick Date** - Next 7 days available
3. **Pick Time** - 30-minute slots (9 AM - 9 PM)
4. Review shop location
5. Review booking summary
6. Click **"Book Now"**

**Key Differences from Freelance Flow**:
- ✅ **NO Travel Cost** (customer walks in)
- ✅ **Date & Time Selection** (scheduled appointment)
- ✅ **Shop Location shown** (customer goes there)
- ✅ **Walk-in service** (not on-demand/ASAP)

---

## 📊 Flow Comparison Table

| Feature | Quick Book | Freelance Barber | Barbershop |
|---------|-----------|------------------|------------|
| **Entry Point** | Quick Book screen | Barbers List | Barbershops List |
| **Barber Selection** | ❌ Auto-matched | ✅ Customer chooses | ✅ From shop barbers |
| **Browse Options** | ❌ No browsing | ✅ Full list browsing | ✅ Shop & barber browsing |
| **Service Location** | Customer's address | Customer's address | Shop location (walk-in) |
| **Timing** | ASAP/On-demand | ASAP/On-demand | Scheduled (date + time) |
| **Travel Cost** | ✅ Yes (distance-based) | ✅ Yes (distance-based) | ❌ No (walk-in) |
| **Date/Time Selection** | ❌ No (ASAP only) | ❌ No (ASAP only) | ✅ Yes (7 days, 30min slots) |
| **Speed** | ⚡ Fastest | 🚀 Fast | 📅 Planned |
| **Best For** | Urgent needs | Specific barber preference | Planned shop visit |

---

## 💰 Pricing Model Differences

### **Freelance (Quick Book & Choose Barber)**

```
Service Price       : RM 40.00
Travel Cost        : RM  5.00  ← RM 5 base (0-4km) + RM 1/km after 4km
Platform Fee       : RM  2.00
─────────────────────────────
Total              : RM 47.00
```

**Travel Cost Formula**:
- Distance ≤ 4km: RM 5.00 (flat rate)
- Distance > 4km: RM 5.00 + (distance - 4) × RM 1.00

**Example**:
- 2.3 km → RM 5.00
- 3.8 km → RM 5.00
- 6.5 km → RM 5.00 + 2.5 = RM 7.50
- 10 km → RM 5.00 + 6.0 = RM 11.00

---

### **Barbershop**

```
Service Price       : RM 40.00
Travel Cost        : RM  0.00  ← NO travel cost (walk-in)
Platform Fee       : RM  2.00
─────────────────────────────
Total              : RM 42.00
```

**No travel cost** because:
- Customer walks into shop
- No barber travel required
- Physical shop location

---

## 🔄 Common Elements Across All Flows

### **After Booking Creation** (All 3 flows converge here):

```
Booking Created
    ↓
Payment Method Screen (/payment-method)
    ↓ Select: Cash / E-Wallet / Card
    ↓
Payment Processing
    ↓
Booking Confirmation
    ↓
Booking Detail Screen (/booking/[id].tsx)
    ↓ View booking status
    ↓
Bookings List (/(tabs)/bookings.tsx)
```

---

## 🎯 Key Differences Summary

### **Quick Book** 🚀
- **Fastest** - no browsing needed
- **Auto-match** - system finds barber
- **ASAP service** - barber comes soon
- **Use when**: Emergency, don't care who cuts hair

### **Choose Barber** 👤
- **Browse & select** - see all options
- **Pick favorite** - choose specific barber
- **ASAP service** - barber comes soon
- **Use when**: Want specific barber, read reviews first

### **Barbershop** 🏢
- **Physical location** - customer walks in
- **Scheduled** - pick date & time
- **No travel cost** - cheaper option
- **Use when**: Prefer shop environment, plan ahead

---

## 📱 Navigation Paths

### **Quick Book**:
```
/quick-book
  → /booking/create?barberId=XXX
    → /payment-method
      → /booking/[id]
```

### **Freelance Barber**:
```
/(tabs)/index
  → /barbers
    → /barber/[id]
      → /booking/create?barberId=XXX
        → /payment-method
          → /booking/[id]
```

### **Barbershop**:
```
/(tabs)/index
  → /barbershops
    → /barbershop/[id]
      → /barbershop/barbers/[shopId]
        → /barbershop/booking/[barberId]?shopId=XXX
          → /payment-method
            → /booking/[id]
```

---

## 🎓 Business Logic Notes

### **Commission Structure** (All flows):
- Platform takes **12% commission** from service price
- Barber receives **88%** of service price
- Platform fee: **RM 2.00** (paid by customer)

### **Service Types**:
- **On-Demand** (Quick Book, Freelance): Barber comes to customer ASAP
- **Scheduled** (Barbershop): Customer visits shop at booked time

### **Location Requirements**:
- **Freelance**: Customer must select/add address
- **Barbershop**: No address needed (shop has fixed location)

---

**This covers all 3 customer booking flows in your Mari Gunting app!** 🎉
