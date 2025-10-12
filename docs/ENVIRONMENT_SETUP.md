# Environment Configuration Guide

This guide explains how to configure environment variables for Mari-Gunting project across different environments (development, staging, production).

## Table of Contents
- [Overview](#overview)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

Mari-Gunting uses environment variables to manage configuration across:
- **Development** - Local development
- **Staging** - Pre-production testing
- **Production** - Live app

All sensitive data (API keys, secrets) are:
1. ✅ Never committed to Git
2. ✅ Encrypted in secure storage on device
3. ✅ Validated on app startup

---

## Setup Instructions

### 1. Create Environment Files

For each app (customer and partner), create `.env` files:

```bash
# Customer App
cp .env.example apps/customer/.env

# Partner App  
cp .env.example apps/partner/.env
```

### 2. Fill in Required Variables

Edit each `.env` file with your actual values:

```bash
# Required (App won't work without these)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional (Add as you integrate services)
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your-token
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
...
```

### 3. Verify Configuration

Run the app to verify environment is loaded:

```bash
# Customer App
cd apps/customer
npm start

# Partner App
cd apps/partner
npm start
```

You should see environment logs in development mode:
```
🌍 Environment: development
🔑 Supabase URL: https://your-project.supabase.co
🗺️  Mapbox Token: ✅
☁️  Cloudinary: ✅
...
```

---

## Environment Variables

### Core Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_APP_ENV` | Yes | `development` \| `staging` \| `production` |
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |

### Services

#### Mapbox (Maps & Location)
```bash
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your-token
```
**Get from:** https://account.mapbox.com/

#### Cloudinary (Image Optimization)
```bash
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret # Server-side only
```
**Get from:** https://cloudinary.com/console

#### Sentry (Error Tracking)
```bash
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-token # For source maps
```
**Get from:** https://sentry.io/settings/

#### Payment Gateway
```bash
# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
STRIPE_SECRET_KEY=sk_test_your-secret # Server-side only

# FPX (Malaysia)
EXPO_PUBLIC_FPX_MERCHANT_ID=your-merchant-id
FPX_MERCHANT_SECRET=your-secret # Server-side only
```

### Feature Flags

Enable/disable features per environment:

```bash
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_ERROR_TRACKING=true
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=false
EXPO_PUBLIC_ENABLE_CHAT=false
EXPO_PUBLIC_ENABLE_VIDEO_CALL=false
```

### Business Configuration

```bash
EXPO_PUBLIC_COMMISSION_RATE=0.15          # 15% platform fee
EXPO_PUBLIC_CANCELLATION_WINDOW=24         # hours before booking
EXPO_PUBLIC_DEFAULT_SEARCH_RADIUS=10       # km
```

---

## Security Best Practices

### ✅ DO's

1. **Use `.env` files** - Never hardcode secrets in code
2. **Prefix client variables** - Use `EXPO_PUBLIC_` for client-side variables
3. **Keep server secrets separate** - Never expose server keys to client
4. **Rotate keys regularly** - Especially production keys
5. **Use different keys** - Separate keys for dev/staging/production
6. **Validate on startup** - Check required variables exist

### ❌ DON'Ts

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Never log secrets** - Even in development
3. **Never expose service role keys** - Server-side only
4. **Never share production keys** - Use team secret managers
5. **Never use production keys in development**

### Example: Secure vs Insecure

**❌ INSECURE:**
```typescript
// Hardcoded API key
const API_KEY = 'sk_live_1234567890abcdef';
```

**✅ SECURE:**
```typescript
// From environment config
import { ENV } from '@shared';

const API_KEY = ENV.STRIPE_PUBLISHABLE_KEY;
```

---

## Using Environment Variables in Code

### Method 1: Direct from ENV Config (Recommended)

```typescript
import { ENV, isFeatureEnabled } from '@shared';

// Get config values
const mapboxToken = ENV.MAPBOX_ACCESS_TOKEN;
const commissionRate = ENV.COMMISSION_RATE;

// Check feature flags
if (isFeatureEnabled('ENABLE_ANALYTICS')) {
  // Initialize analytics
}

// Check environment
if (ENV.APP_ENV === 'production') {
  // Production-only code
}
```

### Method 2: From Expo Constants

```typescript
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
```

---

## Different Environment Setups

### Development
```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
EXPO_PUBLIC_ENABLE_ERROR_TRACKING=false
```

### Staging
```bash
EXPO_PUBLIC_APP_ENV=staging
EXPO_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
EXPO_PUBLIC_ENABLE_ERROR_TRACKING=true
```

### Production
```bash
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
EXPO_PUBLIC_ENABLE_ERROR_TRACKING=true
EXPO_PUBLIC_ENABLE_ANALYTICS=true
```

---

## Secure Storage

For runtime sensitive data (tokens, user data), use the secure storage utility:

```typescript
import { TokenStorage, SecureStorageKey } from '@shared';

// Save tokens
await TokenStorage.saveAccessToken('user-token');

// Get tokens
const token = await TokenStorage.getAccessToken();

// Clear on logout
await TokenStorage.clearTokens();
```

**Storage locations:**
- iOS: Keychain
- Android: Encrypted SharedPreferences
- Web: localStorage (with warnings)

---

## Troubleshooting

### "Missing required environment variables"

**Cause:** Required env vars not set  
**Fix:** Check `.env` file has `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### "Environment variables not loading"

**Cause:** Cache issue or wrong file location  
**Fix:**
```bash
# Clear Expo cache
npx expo start --clear

# Verify .env location
ls -la apps/customer/.env
```

### "Can't access Constants.expoConfig"

**Cause:** Using `app.json` instead of `app.config.ts`  
**Fix:** Ensure `app.config.ts` exists and exports properly

### Different values in iOS/Android

**Cause:** Native cache not cleared  
**Fix:**
```bash
# Clear native builds
rm -rf apps/customer/ios apps/customer/android
npx expo prebuild --clean
```

---

## CI/CD Setup

For GitHub Actions, Bitrise, etc:

```yaml
env:
  EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  # ... other secrets from CI secrets manager
```

---

## Additional Resources

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Supabase Setup](https://supabase.com/docs/guides/getting-started)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)

---

**Need Help?** Open an issue or check the project documentation.
