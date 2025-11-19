import { useState, useEffect } from 'react';
import { getBookingUnreadCount } from '../services/chatService';
import { supabase } from '../config/supabase';

/**
 * Hook to get unread message count for a specific booking
 * Updates in real-time via Supabase Realtime
 */
export function useUnreadCount(bookingId: string | null, userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!bookingId || !userId) {
      setUnreadCount(0);
      return;
    }

    // Fetch initial count
    const fetchCount = async () => {
      const result = await getBookingUnreadCount(bookingId, userId);
      if (result.success && result.count !== undefined) {
        setUnreadCount(result.count);
      }
    };

    fetchCount();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`unread-${bookingId}-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        () => {
          // Re-fetch count on any message change
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, userId]);

  return unreadCount;
}
