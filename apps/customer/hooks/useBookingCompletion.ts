import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import type { Booking } from '@/types';

interface UseBookingCompletionProps {
  booking: Booking | undefined;
  onPointsAwarded?: (points: number) => void;
}

/**
 * Hook to handle points awarding when a booking is completed
 * Awards points only once when status changes to 'completed'
 */
export function useBookingCompletion({ booking, onPointsAwarded }: UseBookingCompletionProps) {
  const addPoints = useStore((state) => state.addPoints);
  const addActivity = useStore((state) => state.addActivity);
  
  // Track if we've already awarded points for this booking
  const hasAwardedPoints = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (!booking || booking.status !== 'completed') {
      return;
    }
    
    // Check if we've already awarded points for this booking
    if (hasAwardedPoints.current.has(booking.id)) {
      return;
    }
    
    // Calculate points (10 points per RM spent on services)
    // Use totalPrice if price is not available (for backward compatibility)
    const subtotal = booking.price || booking.totalPrice || 0;
    const pointsToAward = Math.floor(subtotal * 10);
    
    if (pointsToAward > 0) {
      // Award points
      addPoints(pointsToAward);
      
      // Add activity log
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
      
      addActivity({
        id: Date.now(),
        type: 'earn',
        amount: pointsToAward,
        description: `Service completed - ${booking.serviceName || 'Booking'}`,
        date: formattedDate,
      });
      
      // Mark as awarded
      hasAwardedPoints.current.add(booking.id);
      
      // Notify parent component
      if (onPointsAwarded) {
        onPointsAwarded(pointsToAward);
      }
    }
  }, [booking, addPoints, addActivity, onPointsAwarded]);
  
  return {
    pointsAwarded: booking && hasAwardedPoints.current.has(booking.id),
  };
}
