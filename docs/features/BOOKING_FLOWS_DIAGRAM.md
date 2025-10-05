# Mari Gunting - Complete Booking Flows

## 🔄 Three Booking Methods Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     MARI GUNTING APP                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Quick Book   │  │ Choose       │  │ Barbershop   │        │
│  │ (Fast)       │  │ Barber       │  │ Booking      │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Quick Book Flow (Auto-Match)

**Type**: Mobile Service (Freelance Barber comes to you)

```
Customer Opens Quick Book
         ↓
Set Search Radius (1-50km)
Set Max Budget (RM 10-200)
         ↓
Click "Quick Book"
         ↓
[API searches mockBarbers]
- Filter by: isOnline = true
- Filter by: distance < radius
- Filter by: price < budget
         ↓
Match Found? 
    ├── YES → Navigate to booking/create.tsx
    │           - Pre-filled with matched barber
    │           - Select services
    │           - Select address
    │           - Schedule time
    │           - INCLUDES travel cost
    │           ↓
    │         Confirm & Pay
    │
    └── NO  → Show error modal
              "No barbers available"
```

**Data Source**: `mockBarbers` (4 freelance barbers)
- b1: Amir Hafiz
- b2: Faiz Rahman  
- b3: Azman Ibrahim
- b4: Danish Lee

---

## 2️⃣ Choose Barber Flow (Browse & Select)

**Type**: Mobile Service (Freelance Barber comes to you)

```
Customer Opens Barbers Tab
         ↓
Browse Barber List
- View all freelance barbers
- Filter by: Distance, Price, Rating
- Sort by: Nearest, Popular, Rating
         ↓
Click on Barber Card
         ↓
View Barber Profile (barber/[id].tsx)
- See full details, reviews, portfolio
- View services & prices
         ↓
Click "Book Now"
         ↓
Booking Creation (booking/create.tsx)
- Select services (multiple)
- Select address from saved
- Choose date & time
- INCLUDES travel cost (auto-calculated)
         ↓
Confirm & Pay
```

**Data Source**: `mockBarbers` (4 freelance barbers)
- Shows distance from customer
- Displays travel cost
- Barber travels to customer's location

---

## 3️⃣ Barbershop Booking Flow (Visit Shop) ✨

**Type**: Walk-In Service (Customer visits shop)

```
Customer Opens Barbershops Tab
         ↓
Browse Barbershop List (barbershops.tsx)
- View all shops
- See: Rating, Distance, Services
- Filter by: Open Now, Verified
         ↓
Click on Barbershop Card
         ↓
View Barbershop Details (barbershop/[id].tsx)
- See shop photos, hours, services
- View reviews
         ↓
Click "Book a Barber"
         ↓
Select Staff Member (barbershop/barbers/[shopId].tsx)
[API: getBarbersByShopId(shopId)]
- Filter mockBarbershopStaff by barbershopId
- Shows staff working at THIS SHOP only
         ↓
Staff List Displayed:
- Staff avatar & name
- Rating & completed jobs
- Specializations
- "Available Today" badge
         ↓
Click "Select" on Staff
         ↓
Booking Confirmation (barbershop/booking/[barberId].tsx)
- Select services from staff's offerings
- Choose date & time
- View shop location
- NO TRAVEL COST (customer visits shop)
- Only platform fee + service price
         ↓
Confirm & Pay
```

**Data Source**: `mockBarbershopStaff` (11 shop employees)

### Shop Staff Distribution:
- **shop1** (Kedai Gunting Rambut Ali): staff1, staff2
- **shop2** (The Gentleman Barber): staff3, staff4
- **shop3** (Salon Lelaki Kasual): staff5
- **shop4** (Barbershop Mat Rock): staff6, staff7
- **shop7** (Executive Grooming Lounge): staff8, staff9
- **shop10** (Kings & Queens Barber): staff10, staff11

---

## 💰 Pricing Differences

### Mobile Service (Quick Book & Choose Barber)
```
Service Price:        RM 35.00
Travel Cost:         +RM 10.00  ← Based on distance
Platform Fee:        +RM  2.00
─────────────────────────────────
TOTAL:                RM 47.00
```

### Barbershop Visit
```
Service Price:        RM 35.00
Travel Cost:           RM  0.00  ← NO travel (you visit shop)
Platform Fee:        +RM  2.00
─────────────────────────────────
TOTAL:                RM 37.00
```

**💡 Savings**: Customer saves travel cost by visiting barbershop!

---

## 🔍 Data Separation

### Freelance Barbers (`mockBarbers`)
```typescript
{
  id: 'b1',
  name: 'Amir Hafiz',
  role: 'barber',
  isOnline: true,        ✅ Can be online/offline
  distance: 3.2,         ✅ Distance from customer
  location: {...},       ✅ Current GPS location
  services: [...],
  availability: {...}    ✅ Own schedule
}
```

### Barbershop Staff (`mockBarbershopStaff`)
```typescript
{
  id: 'staff1',
  name: 'Rahim Abdullah',
  barbershopId: 'shop1', ✅ Which shop they work at
  employeeNumber: 'KGA-001',
  isAvailable: true,     ✅ Available at shop today
  workSchedule: {...},   ✅ Shop working hours
  services: [...],
  // NO location field
  // NO distance field  
  // NO isOnline field
}
```

---

## 🎯 API Endpoints Used

### Quick Book
```typescript
api.quickBook(serviceId, time)
→ Returns: Nearest available freelance barber
→ Source: mockBarbers (filtered by isOnline)
```

### Choose Barber
```typescript
api.getBarbers(filters)
→ Returns: All freelance barbers (paginated)
→ Source: mockBarbers

api.getBarberById(barberId)
→ Returns: Single freelance barber details
→ Source: mockBarbers.find(b => b.id === id)
```

### Barbershop Booking
```typescript
api.getBarbershops(filters)
→ Returns: All barbershops
→ Source: mockBarbershops

api.getBarbershopById(shopId)
→ Returns: Single barbershop details
→ Source: mockBarbershops.find(s => s.id === shopId)

api.getBarbersByShopId(shopId)  ← KEY METHOD
→ Returns: Staff at specific shop
→ Source: mockBarbershopStaff.filter(s => s.barbershopId === shopId)

api.getBarberById(staffId)
→ Returns: Staff member details
→ Source: mockBarbershopStaff.find(s => s.id === staffId)
```

---

## ✅ Integration Complete

All three booking flows are now properly separated:
- ✅ Quick Book uses freelance barbers
- ✅ Choose Barber uses freelance barbers  
- ✅ Barbershop Booking uses shop staff
- ✅ No overlap between freelance and shop staff
- ✅ Correct pricing for each flow type
- ✅ Type-safe with proper interfaces

---

## 📱 User Experience

### For Mobile Service (Quick Book / Choose Barber)
👤 "I want a barber to come to my home"
- Browse freelance barbers
- They see your location
- You pay travel cost
- They come to you

### For Barbershop Visit
👤 "I want to go to a barbershop"
- Browse barbershops
- Select preferred shop
- Choose staff at that shop
- No travel cost
- You visit the shop

**Both flows coexist perfectly! 🎉**
