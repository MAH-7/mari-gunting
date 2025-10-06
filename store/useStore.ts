import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Customer, Barber, Service, Address, Booking } from '@/types';

export type Voucher = {
  id: number;
  title: string;
  description: string;
  points: number;
  expires: string;
  type: 'discount' | 'free';
  discountAmount?: number;
  discountPercent?: number;
  minSpend?: number;
  redeemedAt?: string;
  usedAt?: string;
  usedForBooking?: string; // booking ID where voucher was used
  status?: 'redeemed' | 'used' | 'expired'; // tracking voucher lifecycle
};

export type Activity = {
  id: number;
  type: 'earn' | 'redeem';
  amount: number;
  description: string;
  date: string;
};

interface AppState {
  // User
  currentUser: Customer | Barber | null;
  setCurrentUser: (user: Customer | Barber | null) => void;
  
  // Rewards
  userPoints: number;
  setUserPoints: (points: number) => void;
  deductPoints: (points: number) => void;
  addPoints: (points: number) => void;
  
  myVouchers: Voucher[];
  addVoucher: (voucher: Voucher) => void;
  useVoucher: (voucherId: number, bookingId: string) => void;
  
  activity: Activity[];
  addActivity: (activity: Activity) => void;
  
  // Selected items for booking
  selectedBarber: Barber | null;
  setSelectedBarber: (barber: Barber | null) => void;
  
  selectedServices: Service[];
  addService: (service: Service) => void;
  removeService: (serviceId: string) => void;
  clearServices: () => void;
  
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
  
  // Booking
  currentBooking: Booking | null;
  setCurrentBooking: (booking: Booking | null) => void;
  
  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>()(persist(
  (set) => ({
    // Initial state
    currentUser: null,
    userPoints: 1250,
    myVouchers: [],
    activity: [
      { id: 1, type: 'earn', amount: 150, description: 'Haircut booking completed', date: '2 Oct 2025' },
      { id: 2, type: 'redeem', amount: -500, description: 'RM 5 OFF voucher redeemed', date: '28 Sep 2025' },
      { id: 3, type: 'earn', amount: 200, description: 'Beard trim booking completed', date: '25 Sep 2025' },
      { id: 4, type: 'earn', amount: 50, description: 'Daily check-in bonus', date: '20 Sep 2025' },
    ],
    selectedBarber: null,
    selectedServices: [],
    selectedAddress: null,
    currentBooking: null,
    isLoading: false,
    
    // Actions
    setCurrentUser: (user) => set({ currentUser: user }),
    
    setUserPoints: (points) => set({ userPoints: points }),
    deductPoints: (points) => set((state) => ({ userPoints: state.userPoints - points })),
    addPoints: (points) => set((state) => ({ userPoints: state.userPoints + points })),
    
    addVoucher: (voucher) => set((state) => ({ myVouchers: [voucher, ...state.myVouchers] })),
    
    useVoucher: (voucherId, bookingId) => set((state) => ({
      myVouchers: state.myVouchers.map(v => 
        v.id === voucherId 
          ? { ...v, usedAt: new Date().toISOString(), usedForBooking: bookingId, status: 'used' as const }
          : v
      ),
    })),
    
    addActivity: (activity) => set((state) => ({ activity: [activity, ...state.activity] })),
  
  setSelectedBarber: (barber) => set({ selectedBarber: barber }),
  
  addService: (service) => 
    set((state) => {
      // Prevent duplicates
      if (state.selectedServices.find(s => s.id === service.id)) {
        return state;
      }
      return { selectedServices: [...state.selectedServices, service] };
    }),
    
  removeService: (serviceId) =>
    set((state) => ({
      selectedServices: state.selectedServices.filter(s => s.id !== serviceId),
    })),
    
  clearServices: () => set({ selectedServices: [] }),
  
  setSelectedAddress: (address) => set({ selectedAddress: address }),
  
  setCurrentBooking: (booking) => set({ currentBooking: booking }),
  
    setIsLoading: (loading) => set({ isLoading: loading }),
  }),
  {
    name: 'mari-gunting-storage',
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (state) => ({
      currentUser: state.currentUser,
      userPoints: state.userPoints,
      myVouchers: state.myVouchers,
      activity: state.activity,
    }),
  }
));
