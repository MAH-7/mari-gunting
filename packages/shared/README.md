# @mari-gunting/shared

Shared components, utilities, and services for Mari-Gunting apps.

## Installation

This package is used internally within the Mari-Gunting monorepo.

## Usage

### Standard Components

Import most shared components, utilities, and services from the main entrypoint:

```typescript
import { 
  Button, 
  Input, 
  Card,
  Colors,
  Typography,
  Spacing,
  supabase,
  useStore
} from '@mari-gunting/shared';
```

### Map Components

**Important:** MapView and map-related components must be imported from a dedicated entrypoint to prevent loading the `@rnmapbox/maps` native module in Expo Go for screens that don't use maps.

```typescript
// ❌ Don't do this - will cause native module errors
import { MapView } from '@mari-gunting/shared';

// ✅ Do this instead
import { MapView } from '@mari-gunting/shared/map';
```

## Available Exports

### Main Entrypoint (`@mari-gunting/shared`)

- **Components:** Button, Input, Card, Badge, StatusBadge, Avatar, Rating, EmptyState, LoadingSpinner, ErrorBoundary
- **Theme:** Colors, Typography, Spacing, BorderRadius, Shadows, ZIndex, Layout
- **Services:** Auth, Storage, Cloudinary Upload, Mock Data, Geocoding
- **Config:** Supabase, Environment, Cloudinary, Sentry
- **Store:** useStore (Zustand)
- **Utils:** Location utilities, Secure Storage
- **Types:** Database types, shared types

### Map Entrypoint (`@mari-gunting/shared/map`)

- **Components:** MapView, MapViewHandle

## Why Separate Map Entrypoint?

The `@rnmapbox/maps` library requires native code that isn't available in Expo Go. By separating MapView into its own entrypoint:

1. Screens without maps can run in Expo Go without errors
2. Only screens that actually use maps will load the native module
3. Development is faster for non-map features

## Architecture

This package follows a shared library pattern where:

- Components are production-ready and used across Customer and Partner apps
- Theme provides consistent design tokens
- Services encapsulate business logic
- Types ensure type safety across apps

## Contributing

When adding new components:

1. Add components to the appropriate directory (`components/`, `services/`, etc.)
2. Export from the directory's `index.ts`
3. If the component requires native modules not available in Expo Go, create a separate entrypoint like `map.ts`
4. Document the import pattern in this README

## License

Private - Internal use only
