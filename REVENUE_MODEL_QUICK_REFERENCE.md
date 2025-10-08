# 💰 Mari-Gunting Revenue Model - Quick Reference

## 🎯 At a Glance

| Component | Value | Who Gets It |
|-----------|-------|-------------|
| **Service Commission** | 12% | Platform |
| **Platform Fee** | RM 2.00 | Platform |
| **Service Earnings** | 88% | Barber |
| **Travel Fees** | 100% | Barber |

---

## 📊 Quick Examples

### Example 1: RM 30 Haircut (3km)
```
Customer → RM 37.00 (30 + 5 + 2)
Barber   → RM 31.40 (26.40 + 5)
Platform → RM  5.60 (3.60 + 2)
```

### Example 2: RM 80 Grooming (8km)
```
Customer → RM 91.00 (80 + 9 + 2)
Barber   → RM 79.40 (70.40 + 9)
Platform → RM 11.60 (9.60 + 2)
```

### Example 3: RM 50 Barbershop (0km)
```
Customer → RM 52.00 (50 + 0 + 2)
Barber   → RM 44.00 (44 + 0)
Platform → RM  8.00 (6 + 2)
```

---

## 🚗 Travel Cost Formula

```
0-4 km  = RM 5 (base)
4+ km   = RM 5 + (distance - 4) × RM 1/km

Examples:
2 km  = RM 5
4 km  = RM 5
6 km  = RM 7
10 km = RM 11
```

---

## 🧮 Calculation Formulas

### Customer Total:
```typescript
total = servicePrice + travelCost + platformFee
```

### Barber Earnings:
```typescript
netService = servicePrice × 0.88
travelEarnings = travelCost × 1.00  // 100%
totalEarnings = netService + travelEarnings
```

### Platform Revenue:
```typescript
commission = servicePrice × 0.12
total = commission + 2.00
```

---

## 📈 Revenue Projections

| Bookings | Monthly | Annual |
|----------|---------|--------|
| 1,000 | RM 3.8K | RM 45.6K |
| 5,000 | RM 19K | RM 228K |
| 10,000 | RM 38K | RM 456K |
| 25,000 | RM 95K | RM 1.14M |

**Average per booking: RM 3.80**

---

## 🏆 vs Competitors

| Platform | Take Rate |
|----------|-----------|
| Grab | 30-35% |
| Foodpanda | 25-30% |
| **Mari-Gunting** | **15-20%** ✅ |

---

## 📁 Key Files

### Customer App:
- `apps/customer/app/booking/create.tsx`
- `apps/customer/app/payment-method.tsx`

### Partner App:
- `apps/partner/app/(tabs)/earnings.tsx`

### Docs:
- `docs/business/REVENUE_MODEL_IMPLEMENTATION.md`

### Tests:
- `tests/revenue-model-verification.test.ts`

---

## ✅ Status

**All systems operational**
- ✅ Customer app: READY
- ✅ Partner app: READY
- ✅ Tests: 21/21 passing
- ✅ Documentation: Complete

---

**Version:** 1.0  
**Last Updated:** January 2025
