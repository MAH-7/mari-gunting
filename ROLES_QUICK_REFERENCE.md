# Mari Gunting - Roles & App Access Quick Reference

## Role Types

| Role | Description | App Access |
|------|-------------|------------|
| `customer` | Regular users booking services | ✅ Customer App |
| `barber` | Freelance barbers (mobile service) | ✅ Partner App |
| `barbershop_owner` | Owns physical barbershop location | ✅ Partner App |
| `admin` | Platform administrator | 🚧 Not implemented |

## Multi-Role Support

Users can have **multiple roles** stored in the `roles` array:

### ✅ Valid Combinations

```
['customer']                        → Customer only
['customer', 'barber']              → Customer + Freelance barber
['customer', 'barbershop_owner']    → Customer + Shop owner
['barber']                          → Freelance barber only
['barbershop_owner']                → Shop owner only
```

### ❌ Invalid Combinations

```
['barber', 'barbershop_owner']      → CANNOT be both freelance + shop owner
```

**Business Rule**: You can either be a freelance barber OR own a barbershop, not both.

## App Access Rules

### Customer App
- ✅ Anyone can access (customer, barber, shop owner)
- Auto-adds `customer` role on first use if not present

### Partner App
- ❌ Blocks pure customers
- ✅ Requires `barber` OR `barbershop_owner` role
- Redirects customers to partner registration flow

## Registration Flows

### New Customer → Customer App
```
Phone/OTP → Register → ['customer'] → ✅ Use app
```

### New Partner → Partner App
```
Phone/OTP → Complete Profile → Select Account Type
  ├─ Freelance → Onboarding → ['barber'] → ✅ Use app
  └─ Barbershop → Onboarding → ['barbershop_owner'] → ✅ Use app
```

### Customer Upgrading to Partner
```
Customer opens Partner App
  → ❌ Blocked
  → "Register as Partner"
  → Select Account Type
    ├─ Freelance → Onboarding → ['customer', 'barber'] → ✅ Both apps
    └─ Barbershop → Onboarding → ['customer', 'barbershop_owner'] → ✅ Both apps
```

## Database Tables

| Role | Creates Record In | Onboarding Flow |
|------|-------------------|-----------------|
| `customer` | `profiles` only | None required |
| `barber` | `profiles` + `barbers` | Barber onboarding (7 steps) |
| `barbershop_owner` | `profiles` + `barbershops` | Barbershop onboarding (8 steps) |

## Role Check Examples

### Frontend (TypeScript)
```typescript
// Check if user has barber role
const userRoles = profile.roles || [profile.role];
const isBarber = userRoles.includes('barber');

// Check if user has ANY partner role
const isPartner = userRoles.includes('barber') || 
                  userRoles.includes('barbershop_owner');

// Check if customer (everyone should have customer role)
const isCustomer = userRoles.includes('customer');
```

### Backend (SQL)
```sql
-- Check if user has barber role
SELECT * FROM profiles WHERE 'barber' = ANY(roles);

-- Check if user has ANY partner role
SELECT * FROM profiles 
WHERE 'barber' = ANY(roles) OR 'barbershop_owner' = ANY(roles);

-- Using helper function
SELECT * FROM profiles WHERE has_role(roles, 'barber');
```

## Key Functions

### `setup_freelance_barber(user_id)`
- Adds `'barber'` to roles array
- Creates record in `barbers` table
- Keeps existing roles (e.g., customer)

### `setup_barbershop_owner(user_id)`
- Adds `'barbershop_owner'` to roles array
- **Removes** `'barber'` if present (business rule)
- Creates record in `barbershops` table
- Keeps `'customer'` role if present

## Security Notes

🔒 **Partner app access** requires proper onboarding completion
🔒 **RLS policies** enforce role-based data access at database level
🔒 **No automatic role escalation** - customers cannot bypass verification
🔒 **Verification required** - All partners must be verified before going live

---

**Last Updated**: 2025-01-31
**Version**: 1.0
