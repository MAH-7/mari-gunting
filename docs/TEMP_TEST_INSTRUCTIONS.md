# 🧪 Quick Test Instructions - See Jobs with Data

## Problem:
No jobs showing because your user ID doesn't match barber IDs in mock data.

## Solution:
Temporarily modify mockData to match your user OR login as a test barber.

## Option 1: Quick Fix in App (Use DevTools)

In Metro Bundler terminal, enable Debug Mode:
1. Shake device/simulator
2. Enable "Debug JS Remotely"
3. Open browser console
4. Type: `AsyncStorage.clear()` then reload

## Option 2: Better - Add Your User's Jobs

Let me add more bookings that will show up for ANY user...

Actually, let me just add a test button on the Jobs screen to populate fake data!

## Option 3: Login as Test Barber

Go to login screen and use:
- Email: `amir.hafiz@email.com`
- Password: (whatever, mock login accepts anything)

This will log you in as barber 'b1' who has jobs.

---

**Or I can add a "Load Test Data" button to the Jobs screen that creates sample jobs for the current user. Which would you prefer?**
