# Mari-Gunting Production Pricing Model

## 💰 Pricing Breakdown Example (6KM Order)

### Customer Pays:
- **Service**: RM 15.00
- **Travel**: RM 7.00 (Base RM 5 for 0-4km + RM 2 for 2km extra)
- **Platform Fee**: RM 2.00
- **Total**: RM 24.00

### Barber Gets:
- **Service**: RM 13.20 (88% of RM 15)
- **Travel**: RM 7.00 (100% pass-through)
- **Total**: RM 20.20

### Platform Gets:
- **Service Commission**: RM 1.80 (12% of RM 15)
- **Platform Fee**: RM 2.00
- **Total**: RM 3.80

---

## 📊 Revenue Per Booking

| Revenue Source | Amount | % of Total Customer Payment |
|----------------|--------|---------------------------|
| Service Commission (12%) | RM 1.80 | 7.5% |
| Platform Fee | RM 2.00 | 8.3% |
| **Total Platform Revenue** | **RM 3.80** | **15.8%** |
| Barber Takes | RM 20.20 | 84.2% |

---

## 🚀 Scaling Projections

### Monthly Revenue Targets:

| Bookings/Month | Platform Revenue | Annual Revenue |
|----------------|------------------|----------------|
| 1,000 | RM 3,800 | RM 45,600 |
| 5,000 | RM 19,000 | RM 228,000 |
| 10,000 | RM 38,000 | RM 456,000 |
| 25,000 | RM 95,000 | RM 1,140,000 |

*Note: Assumes average RM 3.80 revenue per booking*

---

## ⚙️ Travel Cost Formula

```
0-4 km: RM 5 (base fee)
4+ km: RM 5 + (distance - 4) × RM 1/km

Examples:
- 2 km: RM 5
- 4 km: RM 5  
- 6 km: RM 7 (5 + 2×1)
- 8 km: RM 9 (5 + 4×1)
- 10 km: RM 11 (5 + 6×1)
```

---

## 🎯 Why This Model Works

### ✅ Customer Benefits:
- Transparent pricing (no hidden fees)
- Lower total cost than traditional salons
- Convenient at-home service
- Fair travel cost structure

### ✅ Barber Benefits:
- Keep 88% of service revenue (vs 50-70% at salons)
- 100% of travel cost compensation
- No salon rent/chair fees
- Flexible working hours

### ✅ Platform Benefits:
- Sustainable RM 3.80 per booking revenue
- Simple 12% commission model
- Clear RM 2 platform fee for operational costs
- Scales profitably with volume

---

## 🔄 Implementation Status

- ✅ Updated platform fee: RM 1 → RM 2
- ✅ Added 12% service commission calculation
- ✅ Updated booking creation flow
- ✅ Updated payment method screen
- ✅ Updated booking detail display
- ✅ Added commission fields to database schema
- ✅ Updated API to handle commission data

**Status: PRODUCTION READY** 🚀

---

## 📈 Competitive Analysis vs Grab/Foodpanda

| Platform | Commission | Service Fee | Customer Fee | Total Platform Take |
|----------|------------|-------------|--------------|-------------------|
| **Grab Food** | 25-30% | RM 0.99 | Delivery RM 3-15 | ~30-35% |
| **Foodpanda** | 20-25% | RM 0.99 | Delivery RM 3-12 | ~25-30% |
| **Mari-Gunting** | 12% | RM 2.00 | Travel RM 5-15 | ~15-20% |

**Mari-Gunting is MORE profitable for service providers while maintaining competitive customer pricing!** 💪