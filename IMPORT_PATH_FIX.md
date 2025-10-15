# Import Path Fix

## Issue
The `supabaseApi.ts` file was using alias imports (`@/config/supabase`) which couldn't be resolved.

```typescript
// ❌ This didn't work
import { supabase } from '@/config/supabase';
import { ApiResponse, PaginatedResponse } from '@/types';
import { Profile, Barber as DBBarber, Service as DBService } from '@/types/database';
```

## Solution
Changed to relative imports based on the actual file structure.

```typescript
// ✅ This works
import { supabase } from '../config/supabase';
import { ApiResponse, PaginatedResponse } from '../types';
import { Profile, Barber as DBBarber, Service as DBService } from '../types/database';
```

## File Structure
```
packages/shared/
├── config/
│   └── supabase.ts
├── services/
│   ├── api.ts
│   ├── supabaseApi.ts     ← This file
│   └── ...
└── types/
    ├── index.ts
    └── database.ts
```

## Path Resolution
From `packages/shared/services/supabaseApi.ts`:
- `../config/supabase` → `packages/shared/config/supabase.ts` ✅
- `../types` → `packages/shared/types/index.ts` ✅
- `../types/database` → `packages/shared/types/database.ts` ✅

## Status
✅ **Fixed** - The imports now use relative paths that can be resolved by the bundler.

## Note
The `@/` alias imports work in the customer and partner apps because they have the alias configured in their respective `tsconfig.json` files. However, files in the shared package should use relative imports to ensure they can be imported by both apps.
