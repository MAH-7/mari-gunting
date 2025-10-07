# Mari Gunting Monorepo 🎉

Welcome to the Mari Gunting monorepo! This project now contains **two separate apps**:

## 📱 Two Apps

### 1. **Customer App** (`apps/customer`)
- For customers looking for barber services
- Book appointments, track bookings, leave reviews

### 2. **Partner App** (`apps/partner`)  
- For barbers and barbershops
- Manage jobs, track earnings, schedule management

---

## 🚀 Quick Start

### Run Customer App
```bash
cd apps/customer
npm start
```
Then press:
- `i` for iOS simulator
- `a` for Android emulator  
- Scan QR code for physical device

### Run Partner App
```bash
cd apps/partner
npm start
```
Then press:
- `i` for iOS simulator
- `a` for Android emulator
- Scan QR code for physical device

### Run Both (Two Terminals)
```bash
# Terminal 1 - Customer App
cd apps/customer && npm start

# Terminal 2 - Partner App  
cd apps/partner && npm start
```

---

## 📁 Project Structure

```
mari-gunting/
├── apps/
│   ├── customer/           ← Customer App
│   │   ├── app/            ← Customer screens
│   │   ├── components/     ← Customer-specific components
│   │   └── package.json
│   │
│   └── provider/           ← Partner App
│       ├── app/            ← Partner screens  
│       └── package.json
│
├── packages/
│   └── shared/             ← Shared code
│       ├── components/     ← Shared UI components
│       ├── constants/      ← Colors, typography
│       ├── types/          ← TypeScript types
│       ├── services/       ← Mock data, APIs
│       └── store/          ← Zustand store
│
└── docs/                   ← Documentation
```

---

## 🧪 Testing Setup

### MacBook Simulator (Customer)
```bash
cd apps/customer
npm start
# Press 'i' for iOS simulator
```
Login with: `11-111 1111`

### Your Phone (Provider)
```bash
cd apps/partner
npm start
# Scan QR code with Expo Go
```
Login with: `22-222 2222`

---

## 🔧 Installation

### First Time Setup
```bash
# Install root dependencies
npm install

# Install customer app dependencies
cd apps/customer && npm install

# Install partner app dependencies
cd apps/partner && npm install
```

### After Pulling Updates
```bash
# From root
npm install

# Then in each app
cd apps/customer && npm install
cd apps/partner && npm install
```

---

## 🎯 Key Features

### Customer App ✅
- Find barbers (freelance & shops)
- Browse services & prices
- Book appointments  
- Track bookings
- Leave reviews
- Manage profile

### Partner App ✅ (50% complete)
- Dashboard with stats
- Jobs management (accept, track, complete)
- Progress tracking with timeline
- Photo documentation
- Analytics & earnings
- ⏳ Schedule management (Week 5)
- ⏳ Earnings & payouts (Week 6)
- ⏳ Customer management (Week 7)
- ⏳ Profile & settings (Week 8)

---

## 📝 Notes

- Both apps share the same mock data (via symlinks)
- Changes to `packages/shared` affect both apps
- Each app runs independently
- Use separate terminals to run both simultaneously

---

## 🆘 Troubleshooting

### "Module not found" error
```bash
# Clear cache and reinstall
cd apps/customer (or apps/partner)
rm -rf node_modules
npm install
npm start -- --clear
```

### Apps not loading
```bash
# Reset Expo cache
cd apps/customer (or apps/partner)
expo start -c
```

### Imports not working
- Check that symlinks exist in app folders
- Verify `packages/shared` has all files
- Try restarting Metro bundler

---

## 🎉 Ready to Develop!

1. **Customer App**: Open one terminal → `cd apps/customer && npm start`
2. **Partner App**: Open another terminal → `cd apps/partner && npm start`  
3. Test both apps on different devices!

Enjoy coding! 🚀
