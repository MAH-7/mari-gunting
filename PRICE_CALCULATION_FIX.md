# Price Calculation & Display Fix

## Issue

User reported price mismatch between Confirm Booking and Payment screens:
- **Confirm Booking screen:** Service RM 120 + Travel RM 5 = **Total RM 125**
- **Payment screen:** **Total RM 124.60**

## Root Cause

The issue was caused by inconsistent number formatting:

### 1. Actual Calculation (Correct)
```typescript
Service: RM 120.00
Distance: 2.3 km
Travel Fee: 2.3 × RM 2/km = RM 4.60
Total: RM 120 + RM 4.60 = RM 124.60 ✓
```

### 2. Display on Confirm Booking Screen (Misleading)
The `formatCurrency()` function was rounding to 0 decimal places:
```typescript
formatCurrency(4.60) → "RM 5"  // Rounded up!
formatCurrency(124.60) → "RM 125"  // Rounded up!
```

This made users think the total was RM 125, but the actual value passed to payment was RM 124.60.

---

## Solution

Created a new `formatPrice()` function that shows decimals when present:

### New Function
```typescript
// In utils/format.ts
export const formatPrice = (amount: number): string => {
  // Check if amount has decimals
  const hasDecimals = amount % 1 !== 0;
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
};
```

### Behavior
```typescript
formatPrice(120)    → "RM 120"    // No decimals for whole numbers
formatPrice(4.60)   → "RM 4.60"   // Shows decimals when present
formatPrice(124.60) → "RM 124.60" // Shows decimals when present
formatPrice(5.00)   → "RM 5"      // Hides unnecessary .00
```

---

## Changes Made

### 1. Added `formatPrice()` Function
**File:** `utils/format.ts`
- New function that intelligently shows/hides decimals
- Shows decimals only when amount has non-zero cents
- More accurate for financial calculations

### 2. Updated Booking Screen
**File:** `app/booking/create.tsx`

**Changed imports:**
```typescript
import { formatCurrency, formatPrice } from '@/utils/format';
```

**Updated travel fee display:**
```typescript
// Before:
<Text style={styles.priceValue}>{formatCurrency(travelCost)}</Text>

// After:
<Text style={styles.priceValue}>{formatPrice(travelCost)}</Text>
```

**Updated total display:**
```typescript
// Before:
<Text style={styles.totalValue}>{formatCurrency(total)}</Text>

// After:
<Text style={styles.totalValue}>{formatPrice(total)}</Text>
```

### 3. Enhanced Calculation Precision
Added comments and ensured proper rounding:
```typescript
// Round to 2 decimal places to avoid floating point precision issues
const travelCost = Math.round(distance * travelCostPerKm * 100) / 100;
// Ensure total is also rounded to 2 decimal places
const total = Math.round((subtotal + travelCost) * 100) / 100;
```

---

## Result

### Now Shows Correctly

**Confirm Booking Screen:**
```
Services (1):        RM 120
Travel Fee (2.3 km): RM 4.60
─────────────────────────────
Total:               RM 124.60
```

**Payment Screen:**
```
Total
RM 124.60
```

✅ **Both screens now show the same amount!**

---

## When to Use Each Function

### Use `formatCurrency()`
- For service prices (usually whole numbers)
- For displaying round amounts
- When you want clean, simple displays
- Example: Service list, barber profiles

### Use `formatPrice()`
- For calculated totals
- For fees that might have decimals
- For payment amounts
- When precision matters
- Example: Subtotals, travel fees, final totals

---

## Edge Cases Handled

### 1. Whole Numbers
```typescript
formatPrice(100) → "RM 100"  // Not "RM 100.00"
```

### 2. Decimal Amounts
```typescript
formatPrice(99.50) → "RM 99.50"
formatPrice(12.99) → "RM 12.99"
```

### 3. Trailing Zeros
```typescript
formatPrice(5.00) → "RM 5"  // Not "RM 5.00"
formatPrice(5.10) → "RM 5.10"
```

### 4. Floating Point Precision
```typescript
// Before calculation
const value = 2.3 * 2;  // Might be 4.600000000001

// After rounding
const rounded = Math.round(value * 100) / 100;  // Exactly 4.60
formatPrice(rounded) → "RM 4.60"
```

---

## Testing Checklist

### Confirm Booking Screen
- [ ] Service prices display correctly (no decimals for RM 120)
- [ ] Travel fee shows decimals when needed (RM 4.60)
- [ ] Total matches exact calculation (RM 124.60)
- [ ] Multiple services calculate correctly

### Payment Screen
- [ ] Amount matches confirm booking screen exactly
- [ ] Displays with proper formatting

### Different Distances
- [ ] 1.0 km → RM 2 (no decimals)
- [ ] 1.5 km → RM 3 (no decimals)
- [ ] 2.3 km → RM 4.60 (with decimals)
- [ ] 3.7 km → RM 7.40 (with decimals)

### Multiple Services
- [ ] RM 35 + RM 55 = RM 90 + RM 4.60 travel = RM 94.60
- [ ] All amounts display consistently

---

## Future Considerations

### Rounding Rules
Currently using **mathematical rounding** (round half up):
- 4.50 → 5
- 4.49 → 4

If business prefers **always round up** for travel fees:
```typescript
const travelCost = Math.ceil(distance * travelCostPerKm * 100) / 100;
```

### Tax/Service Charge
If adding tax or service charge later:
```typescript
const tax = Math.round(subtotal * 0.06 * 100) / 100;  // 6% tax
const serviceCharge = Math.round(subtotal * 0.10 * 100) / 100;  // 10% service
const total = Math.round((subtotal + travelCost + tax + serviceCharge) * 100) / 100;
```

### Currency Display Preferences
Some regions prefer:
- Always show 2 decimals: "RM 100.00"
- Never show decimals: "RM 100"
- Show decimals only when needed: "RM 100" or "RM 4.60" ✓ (current)

The current implementation is the most user-friendly.

---

## Summary

✅ **Problem:** Price mismatch due to rounding in display  
✅ **Solution:** New `formatPrice()` function for accurate display  
✅ **Result:** Consistent pricing across all screens  
✅ **Impact:** Better user trust and fewer complaints  

The fix ensures that users see exactly what they'll pay, with no surprises at checkout! 💰
