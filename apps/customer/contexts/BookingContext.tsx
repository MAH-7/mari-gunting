/**
 * Booking Context - Grab-style Architecture
 * 
 * This is the PROPER way to handle booking flow state.
 * Instead of passing params through every navigation,
 * we use React Context to maintain global booking state.
 * 
 * Benefits:
 * - No param drilling
 * - State persists across navigation
 * - Type-safe
 * - Easy to test
 * - Single source of truth
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { router } from 'expo-router';
import { addressService } from '@mari-gunting/shared/services/addressService';

// Types
export interface BookingAddress {
  id: string;
  label: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
}

export interface BookingContextState {
  // Flow state
  isInBookingFlow: boolean;
  
  // Barber info
  barberId: string | null;
  barberName: string | null;
  
  // Selected data
  selectedServices: string[];
  selectedAddress: BookingAddress | null;
  serviceNotes: string;
  
  // Actions
  startBookingFlow: (barberId: string, barberName: string, userId?: string) => void;
  endBookingFlow: () => void;
  setSelectedAddress: (address: BookingAddress) => void;
  setSelectedServices: (services: string[]) => void;
  setServiceNotes: (notes: string) => void;
  
  // Navigation helpers
  goToAddressSelection: () => void;
  returnToBooking: (addressId?: string) => void;
}

// Create context
const BookingContext = createContext<BookingContextState | undefined>(undefined);

// Provider component
export function BookingProvider({ children }: { children: React.ReactNode }) {
  // State
  const [isInBookingFlow, setIsInBookingFlow] = useState(false);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [barberName, setBarberName] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<BookingAddress | null>(null);
  const [serviceNotes, setServiceNotes] = useState('');

  // Start booking flow
  const startBookingFlow = useCallback(async (id: string, name: string, userId?: string) => {
    console.log('🚀 Starting booking flow for barber:', name);
    setIsInBookingFlow(true);
    setBarberId(id);
    setBarberName(name);
    setSelectedServices([]);
    setServiceNotes('');
    
    // Auto-select default address if available (Grab-style UX)
    if (userId) {
      try {
        const response = await addressService.getCustomerAddresses(userId);
        const addresses = response.data || [];
        const defaultAddress = addresses.find(addr => addr.is_default);
        
        if (defaultAddress) {
          const fullAddress = [
            defaultAddress.address_line1,
            defaultAddress.address_line2,
            defaultAddress.city,
            defaultAddress.state,
            defaultAddress.postal_code
          ].filter(Boolean).join(', ');
          
          setSelectedAddress({
            id: defaultAddress.id,
            label: defaultAddress.label,
            fullAddress: fullAddress,
            latitude: defaultAddress.latitude,
            longitude: defaultAddress.longitude,
          });
          
          console.log('✅ Auto-selected default address:', defaultAddress.label);
        } else {
          setSelectedAddress(null);
        }
      } catch (error) {
        console.error('Failed to fetch default address:', error);
        setSelectedAddress(null);
      }
    } else {
      setSelectedAddress(null);
    }
  }, []);

  // End booking flow (clear everything)
  const endBookingFlow = useCallback(() => {
    console.log('✅ Ending booking flow');
    setIsInBookingFlow(false);
    setBarberId(null);
    setBarberName(null);
    setSelectedServices([]);
    setSelectedAddress(null);
    setServiceNotes('');
  }, []);

  // Navigation helpers
  const goToAddressSelection = useCallback(() => {
    if (!isInBookingFlow) {
      console.warn('Not in booking flow!');
      return;
    }
    
    // Navigate to addresses with fromBooking flag
    router.push('/profile/addresses?fromBooking=true');
  }, [isInBookingFlow]);

  const returnToBooking = useCallback((addressId?: string) => {
    if (!isInBookingFlow || !barberId) {
      console.warn('Not in booking flow!');
      return;
    }

    // If address was selected, context already has it
    // Just go back
    router.back();
  }, [isInBookingFlow, barberId]);

  const value: BookingContextState = {
    isInBookingFlow,
    barberId,
    barberName,
    selectedServices,
    selectedAddress,
    serviceNotes,
    startBookingFlow,
    endBookingFlow,
    setSelectedAddress,
    setSelectedServices,
    setServiceNotes,
    goToAddressSelection,
    returnToBooking,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

// Custom hook to use booking context
export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
}

// Convenience hook - returns null if not in booking flow
export function useBookingIfActive() {
  const context = useContext(BookingContext);
  if (!context || !context.isInBookingFlow) {
    return null;
  }
  return context;
}
