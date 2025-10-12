# Environment Configuration - Quick Start

## ⚡ Quick Setup (2 minutes)

### 1. Run Setup Script
```bash
./scripts/setup-env.sh
```

### 2. Edit Environment Files
```bash
# Customer App
nano apps/customer/.env

# Partner App
nano apps/partner/.env
```

### 3. Add Your Credentials
```bash
# Minimum required:
EXPO_PUBLIC_SUPABASE_URL=https://uufiyurcsldecspakneg.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Start App
```bash
cd apps/customer
npm start
```

✅ Done! Check console for environment validation.

---

## 📁 File Structure

```
mari-gunting/
├── .env.example          # Template (copy this)
├── apps/
│   ├── customer/
│   │   ├── .env          # Customer app config (git-ignored)
│   │   └── app.config.ts # Reads from .env
│   └── partner/
│       ├── .env          # Partner app config (git-ignored)
│       └── app.config.ts # Reads from .env
└── packages/shared/
    ├── config/env.ts     # Environment utilities
    └── utils/secureStorage.ts  # Secure storage
```

---

## 🔑 Essential Variables

| Variable | Where to Get | Required? |
|----------|--------------|-----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | ✅ Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | ✅ Yes |
| `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` | https://account.mapbox.com/ | Later |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | https://cloudinary.com/console | Later |

---

## 💻 Usage in Code

```typescript
import { ENV, isFeatureEnabled, TokenStorage } from '@shared';

// Get config
const apiUrl = ENV.SUPABASE_URL;
const mapboxToken = ENV.MAPBOX_ACCESS_TOKEN;

// Check feature flags
if (isFeatureEnabled('ENABLE_ANALYTICS')) {
  // Initialize analytics
}

// Secure storage
await TokenStorage.saveAccessToken(token);
const token = await TokenStorage.getAccessToken();
```

---

## 🔐 Security Checklist

- ✅ `.env` files in `.gitignore`
- ✅ Pre-commit hook prevents committing secrets
- ✅ Separate keys for dev/staging/production
- ✅ Server secrets never exposed to client
- ✅ Tokens stored in encrypted storage (Keychain/SharedPreferences)

---

## 🚨 Common Issues

### "Missing required environment variables"
**Fix:** Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `.env`

### Environment not loading
```bash
# Clear cache
npx expo start --clear
```

### Git won't let me commit
**Reason:** Pre-commit hook detected possible secrets  
**Fix:** Review your changes, remove secrets, or use `git commit --no-verify` if false positive

---

## 📚 Full Documentation

See [docs/ENVIRONMENT_SETUP.md](./docs/ENVIRONMENT_SETUP.md) for complete guide.

---

**🔗 Quick Links:**
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Mapbox Account](https://account.mapbox.com/)
- [Cloudinary Console](https://cloudinary.com/console)
- [Sentry Settings](https://sentry.io/settings/)
