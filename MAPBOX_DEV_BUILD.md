# 🗺️ Mapbox Development Build Guide

## ⚠️ Important: Mapbox Requires Custom Build

Mapbox uses **native modules** that are **NOT available in Expo Go**. You must create a **custom development build** to use maps.

---

## 🚀 Quick Build Instructions

### Option 1: Local Development Build (Recommended)

#### For iOS:

```bash
cd apps/customer

# 1. Prebuild (generates native iOS project)
npx expo prebuild --clean

# 2. Run on iOS simulator or device
npx expo run:ios
```

#### For Android:

```bash
cd apps/customer

# 1. Prebuild (generates native Android project)  
npx expo prebuild --clean

# 2. Run on Android emulator or device
npx expo run:android
```

---

### Option 2: EAS Build (Cloud Build)

If local builds don't work or you want to test on physical device:

```bash
cd apps/customer

# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Configure project
eas build:configure

# 4. Create development build
eas build --profile development --platform ios
# or
eas build --profile development --platform android

# 5. Install on device when build completes
```

---

## 🧪 Testing Mapbox

### After Custom Build is Running:

1. Open your custom build (not Expo Go!)
2. Login to the app
3. Go to **Profile** tab
4. Scroll to **Developer** section
5. Tap **"🗺️ Test Mapbox"**
6. You should see the interactive map!

---

## ⚡ For Now (Expo Go)

If you just want to continue development without maps:

✅ **Everything else works in Expo Go!**
- Location permissions ✅
- Address management ✅
- Profile features ✅
- Booking system ✅

The app will show a helpful error message when you try to open the map, explaining that you need a custom build.

---

## 🔧 What Happens During Build

1. **`npx expo prebuild`**:
   - Generates `/ios` and `/android` folders
   - Installs native dependencies (including Mapbox)
   - Configures permissions

2. **`npx expo run:ios/android`**:
   - Compiles native code
   - Installs on simulator/device
   - Starts Metro bundler

---

## 💡 Development Workflow

### With Expo Go (Current):
```
Edit code → Save → Hot reload ✅
Works for: 90% of features
```

### With Custom Build (For Mapbox):
```
Edit code → Save → Hot reload ✅
Works for: 100% of features including maps
```

**Note**: You only need to rebuild when:
- Adding new native modules
- Changing app.json configuration
- Updating native dependencies

Regular code changes still hot-reload! 🔥

---

## 🎯 Prerequisites for Local Build

### iOS:
- ✅ macOS computer
- ✅ Xcode installed
- ✅ iOS Simulator or physical device
- ✅ CocoaPods (`sudo gem install cocoapods`)

### Android:
- ✅ Android Studio installed
- ✅ Android SDK configured
- ✅ Android Emulator or physical device
- ✅ Java JDK 17+

---

## 📱 Which Build Should You Use?

| Scenario | Build Type | Command |
|----------|-----------|---------|
| **Quick testing** | Expo Go | `npx expo start` |
| **Test maps locally** | Local Dev Build | `npx expo run:ios` |
| **Test on physical device** | EAS Build | `eas build --profile development` |
| **Production release** | EAS Build | `eas build --profile production` |

---

## 🐛 Common Issues

### Issue: Build fails on iOS

**Solution:**
```bash
cd apps/customer/ios
pod install --repo-update
cd ..
npx expo run:ios
```

### Issue: Build fails on Android

**Solution:**
```bash
cd apps/customer
npx expo prebuild --clean
npx expo run:android
```

### Issue: "Command not found: expo"

**Solution:**
```bash
npm install -g expo-cli
# or use npx
npx expo run:ios
```

---

## ⏱️ Build Times

| Build Type | First Time | Subsequent |
|------------|-----------|------------|
| Local iOS | ~10-15 min | ~2-5 min |
| Local Android | ~10-20 min | ~2-5 min |
| EAS Cloud | ~15-30 min | ~15-30 min |

---

## 💰 Cost

| Build Type | Cost |
|------------|------|
| **Local Build** | Free ✅ |
| **EAS Development Build** | Free ✅ (unlimited) |
| **EAS Production Build** | Limited free tier, then paid |

---

## 📚 Resources

- **Expo Dev Builds**: https://docs.expo.dev/develop/development-builds/create-a-build/
- **EAS Build**: https://docs.expo.dev/build/setup/
- **Mapbox Install**: https://rnmapbox.github.io/docs/install
- **Troubleshooting**: https://docs.expo.dev/troubleshooting/build-errors/

---

## ✅ Summary

**For Development Without Maps (Now)**:
- Continue using Expo Go
- Everything except maps works

**When You Need Maps**:
- Run `npx expo run:ios` or `npx expo run:android`
- Takes ~10-15 minutes first time
- Then hot-reload works normally

**Your Mapbox is configured and ready!** Once you build, it will work perfectly. 🗺️✨
