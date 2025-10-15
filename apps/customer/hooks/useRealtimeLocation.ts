import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { parseLocation } from '@mari-gunting/shared/services/locationService';

export interface BarberLocation {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
}

export interface UseRealtimeLocationReturn {
  location: BarberLocation | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  isStale: boolean;
  refetch: () => Promise<void>;
}

const STALE_THRESHOLD_MS = 30000; // Consider stale after 30 seconds

/**
 * Hook to track barber's real-time location
 * @param barberId The barber's user ID
 * @param enabled Whether to start tracking (default: true)
 */
export function useRealtimeLocation(
  barberId: string | null | undefined,
  enabled: boolean = true
): UseRealtimeLocationReturn {
  const [location, setLocation] = useState<BarberLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Check if location is stale
  const isStale = lastUpdate
    ? Date.now() - lastUpdate.getTime() > STALE_THRESHOLD_MS
    : false;

  // Fetch initial location
  const fetchLocation = useCallback(async () => {
    if (!barberId || !enabled) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('location, updated_at')
        .eq('id', barberId)
        .single();

      if (fetchError) throw fetchError;

      if (data?.location) {
        const coords = parseLocation(data.location);
        
        if (coords) {
          setLocation({
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: new Date(data.updated_at || Date.now()),
            accuracy: coords.accuracy,
          });
          setLastUpdate(new Date());
        } else {
          setError('Unable to parse location');
        }
      }
    } catch (err) {
      console.error('Error fetching barber location:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch location');
    } finally {
      setIsLoading(false);
    }
  }, [barberId, enabled]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!barberId || !enabled) return;

    console.log('📍 Starting real-time location tracking for barber:', barberId);

    // Fetch initial location
    fetchLocation();

    // Set up real-time subscription
    const channel = supabase
      .channel(`barber-location-${barberId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${barberId}`,
        },
        (payload) => {
          console.log('📍 Barber location updated:', payload);

          if (payload.new?.location) {
            const coords = parseLocation(payload.new.location);
            
            if (coords) {
              setLocation({
                latitude: coords.latitude,
                longitude: coords.longitude,
                timestamp: new Date(payload.new.updated_at || Date.now()),
                accuracy: coords.accuracy,
              });
              setLastUpdate(new Date());
              setError(null);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Location tracking subscription status:', status);
      });

    // Cleanup on unmount
    return () => {
      console.log('🛑 Stopping location tracking');
      supabase.removeChannel(channel);
    };
  }, [barberId, enabled, fetchLocation]);

  return {
    location,
    isLoading,
    error,
    lastUpdate,
    isStale,
    refetch: fetchLocation,
  };
}
