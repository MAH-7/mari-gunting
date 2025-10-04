# Quick Start Guide - Mari Gunting

## ⚡ Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm start
```

### 3. Open the App
- **iOS**: Press `i` to open iOS simulator
- **Android**: Press `a` to open Android emulator
- **Physical Device**: Scan QR code with Expo Go app

## 📱 Testing the App

### Current Features You Can Test:

1. **Home Screen** 
   - Browse 4 mock barbers
   - Search for barbers by name or specialization
   - Filter by "All Barbers" or "Online Now"
   - Click on a barber card (detail screen coming soon)
   - View barber ratings, prices, and specializations

2. **Bookings Screen**
   - View 3 sample bookings
   - Switch between "Upcoming" and "History" tabs
   - See booking details (barber, services, date, price)
   - Different status badges (Pending, Accepted, Completed)

3. **Profile Screen**
   - View customer profile information
   - See saved addresses (2 mock addresses)
   - View stats (mock data)
   - Menu items for future features

## 🎯 What to Expect

The app uses **mock data** to simulate a real experience:
- API calls have simulated delays (500-1000ms)
- All data is stored locally
- Changes won't persist between restarts
- Ready for backend integration in Phase 2

## 🔄 Development Workflow

### Making Changes
1. Edit files in the `app/`, `components/`, or `services/` folders
2. Save the file
3. The app will automatically reload (Fast Refresh)

### Common Commands
```bash
# Start with cache cleared
npm start -- --clear

# Type checking
npx tsc --noEmit

# Format code (if you add Prettier)
npm run format
```

## 🐛 Troubleshooting

### App won't start?
```bash
# Clear cache and restart
npm start -- --clear
```

### Module not found errors?
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Metro bundler issues?
```bash
# Kill all node processes and restart
killall -9 node
npm start
```

## 📚 Next Steps

### Immediate Additions (You can start here):
1. **Barber Detail Screen** (`app/barber/[id].tsx`)
   - Full barber profile
   - Photo gallery
   - Service list with prices
   - Reviews section
   - "Book Now" button

2. **Booking Flow** (`app/booking/confirm.tsx`)
   - Service selection
   - Date/time picker
   - Address selection
   - Notes input
   - Payment method selection

3. **Reusable Components** (`components/`)
   - Button component
   - Card component
   - Input component
   - Badge component
   - Avatar component

### File Structure for New Screens:
```typescript
// app/barber/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export default function BarberDetailScreen() {
  const { id } = useLocalSearchParams();
  // ... your code
}
```

## 💡 Pro Tips

1. **Use TypeScript**: The app is fully typed. Let TypeScript guide you!
2. **Check Types**: Look at `types/index.ts` for all data structures
3. **Mock Data**: See `services/mockData.ts` for example data
4. **Utility Functions**: Use helpers from `utils/format.ts`
5. **State Management**: Use Zustand store for global state

## 🎨 Design System

### Colors (from Tailwind config)
- Primary: `primary-500` (#0ea5e9)
- Success: `green-500`
- Warning: `yellow-500`
- Danger: `red-500`
- Gray scale: `gray-50` to `gray-900`

### Common Patterns
```tsx
// Card
<View className="bg-white rounded-2xl border border-gray-200 p-4">

// Button
<TouchableOpacity className="bg-primary-500 px-6 py-3 rounded-xl">
  <Text className="text-white font-semibold">Button Text</Text>
</TouchableOpacity>

// Badge
<View className="bg-green-100 px-2 py-1 rounded-full">
  <Text className="text-green-700 text-xs font-semibold">Online</Text>
</View>
```

## 📞 Need Help?

- Check the main `README.md` for detailed documentation
- Review the code structure in existing screens
- TypeScript errors? Check `types/index.ts`
- Styling issues? Review Tailwind classes in working screens

Happy coding! 🚀
