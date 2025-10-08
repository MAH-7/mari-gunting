# 📸 Camera & Selfie Upload Troubleshooting Guide

Quick guide to fix camera and selfie upload issues.

---

## 🔧 What I Fixed

### **Changes Made:**

1. ✅ **Added Gallery Option for Selfie**
   - Previously: Only "Take Selfie" button
   - Now: "Take Selfie" + "Choose Photo" buttons
   - This allows you to use existing photos when camera isn't available

2. ✅ **Better Error Handling**
   - Improved error messages
   - Shows specific camera permission prompts
   - Suggests alternative (gallery) if camera fails

3. ✅ **Fixed Deprecation Warning**
   - Updated from `MediaTypeOptions.Images` to `['images']`

---

## 🐛 Common Issues & Solutions

### **Issue 1: Camera Not Working on iOS Simulator**

**Problem:** iOS Simulator doesn't have a real camera

**Solutions:**
1. **Use "Choose Photo" instead of "Take Selfie"**
   - Click the "Choose Photo" button
   - Select any image from the gallery

2. **Test on Real Device**
   - Use Expo Go app on your actual iPhone
   - Scan QR code from `npx expo start`
   - Camera will work properly

3. **Use Android Emulator**
   - Android emulator can simulate camera
   - Or test on real Android device

---

### **Issue 2: Permission Denied**

**Problem:** Camera permission not granted

**Solutions:**

#### On iOS Device:
```
Settings → Mari Gunting (or Expo Go) → Camera → Allow
```

#### On Android Device:
```
Settings → Apps → Mari Gunting (or Expo Go) → Permissions → Camera → Allow
```

---

### **Issue 3: Camera Opens But Crashes**

**Problem:** App crashes when camera opens

**Solutions:**

1. **Restart the App**
   ```bash
   # In terminal, press:
   r  # to reload
   ```

2. **Clear Cache**
   ```bash
   npx expo start -c
   ```

3. **Use Gallery Instead**
   - Click "Choose Photo" option
   - Bypass camera completely

---

## ✅ Testing the Selfie Feature

### **Option A: Using Gallery (Simulator-Friendly)**

1. Go to eKYC screen
2. Scroll to "Selfie for Verification"
3. Click **"Choose Photo"** button
4. Select any image from gallery
5. ✅ Selfie uploaded!

### **Option B: Using Camera (Real Device Only)**

1. Go to eKYC screen
2. Scroll to "Selfie for Verification"
3. Click **"Take Selfie"** button
4. Allow camera permission if prompted
5. Take selfie
6. Click "Use Photo"
7. ✅ Selfie uploaded!

---

## 📱 Platform-Specific Notes

### **iOS Simulator:**
- ❌ Camera doesn't work
- ✅ Gallery works fine
- **Solution:** Use "Choose Photo" button

### **iOS Device:**
- ✅ Camera works
- ✅ Gallery works
- **Note:** Permission prompt appears first time

### **Android Emulator:**
- ⚠️ Camera might work (simulated)
- ✅ Gallery works
- **Note:** May need to configure emulator camera

### **Android Device:**
- ✅ Camera works
- ✅ Gallery works
- **Note:** Permission prompt appears first time

---

## 🎯 Quick Test Flow

To test the entire eKYC screen:

```
1. Full Name: "Ahmad Bin Ali"
2. NRIC: "990101-01-1234"
3. NRIC Front: Click "Choose from Gallery" → Select image
4. NRIC Back: Click "Choose from Gallery" → Select image
5. Selfie: Click "Choose Photo" → Select image
6. Submit ✅
```

---

## 🔍 Debugging Camera Errors

If you see an error, check the console:

```bash
# Look for:
Camera error: [error message]
```

Common error messages:

| Error | Meaning | Solution |
|-------|---------|----------|
| `Camera not available` | No camera on device/simulator | Use gallery option |
| `Permission denied` | User denied permission | Allow in settings |
| `Camera busy` | Another app using camera | Close other apps |
| `Unknown error` | Generic error | Restart app, use gallery |

---

## 💡 Best Practices

### **For Development:**
1. Test on iOS Simulator → Use gallery
2. Test on Android Emulator → Use gallery
3. Test on Real Device → Test both camera & gallery

### **For Testing:**
```bash
# iOS Simulator (Gallery only)
npx expo start --ios

# Android Emulator (Camera might work)
npx expo start --android

# Real Device (Everything works)
npx expo start
# Scan QR with Expo Go
```

---

## 🚀 Current Features

### **All Upload Buttons:**

1. **NRIC/Passport Front:**
   - 📷 Take Photo
   - 🖼️ Choose from Gallery

2. **NRIC/Passport Back:**
   - 📷 Take Photo
   - 🖼️ Choose from Gallery

3. **Selfie:**
   - 📷 Take Selfie
   - 🖼️ Choose Photo (NEW!)

### **After Upload:**
- ✅ Green checkmark confirmation
- 👁️ "Change" or "Retake" button
- 📝 Helper text for guidance

---

## 📝 Error Messages

You'll see helpful error messages:

### **Permission Error:**
```
Camera Permission Required
Please allow camera access in your device settings to take photos.

[Cancel] [Open Settings]
```

### **Camera Error:**
```
Camera Error
Failed to take photo. Please try choosing from gallery instead.

[OK]
```

### **Validation Error:**
```
Validation Error
Please complete all required fields

[OK]
```

---

## 🎉 Success!

After fixing:
- ✅ Selfie has two options (camera + gallery)
- ✅ Works on iOS Simulator (via gallery)
- ✅ Works on real devices (both options)
- ✅ Better error messages
- ✅ No more deprecation warnings

---

## 🆘 Still Having Issues?

If selfie upload still doesn't work:

1. **Check permissions:**
   ```
   Settings → App → Permissions → Camera/Photos → Allow
   ```

2. **Try gallery option:**
   - Click "Choose Photo" instead
   - Select any image

3. **Restart app:**
   ```bash
   npx expo start -c
   ```

4. **Check console for errors:**
   - Look for "Camera error:" logs
   - Share error message for help

---

**Happy Testing! 📸✨**

The selfie upload should now work perfectly on all platforms!
