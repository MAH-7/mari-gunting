import { useState, useEffect } from 'react';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { parseLocation } from '@mari-gunting/shared/services/supabaseApi';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface BarberLocation {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
}

export interface UseRealtimeBarberLocationResult {
  location: BarberLocation | null;
  isConnected: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Hook to subscribe to real-time location updates for a specific barber
 * Uses Supabase Realtime to listen for location changes in the profiles table
 * 
 * @param barberId - The barber's user ID (profiles.id)
 * @param enabled - Whether to enable the subscription (default: true)
 * @returns Real-time location data and connection status
 */
export function useRealtimeBarberLocation(
  barberId: string | null,
  enabled: boolean = true
): UseRealtimeBarberLocationResult {
  const [location, setLocation] = useState<BarberLocation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!barberId || !enabled) {
      setIsConnected(false);
      return;
    }

    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        console.log('🔄 Setting up realtime subscription for barber:', barberId);

        // Create a channel for this specific barber's location
        channel = supabase
          .channel(`barber-location:${barberId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${barberId}`,
            },
            (payload) => {
              console.log('📍 Received location update:', payload);
              
              try {
                const newLocation = payload.new?.location;
                
                if (newLocation) {
                  // Parse the PostGIS location data (WKB hex format)
                  const parsed = parseLocation(newLocation);
                  
                  if (parsed) {
                    const barberLocation: BarberLocation = {
                      latitude: parsed.latitude,
                      longitude: parsed.longitude,
                      timestamp: new Date(),
                      // Note: GPS accuracy is not stored in profiles, could be added later
                    };
                    
                    setLocation(barberLocation);
                    setLastUpdated(new Date());
                    setError(null);
                    
                    console.log('✅ Barber location updated:', {
                      lat: barberLocation.latitude.toFixed(6),
                      lng: barberLocation.longitude.toFixed(6),
                      time: barberLocation.timestamp.toISOString(),
                    });
                  }
                }
              } catch (parseError) {
                console.error('❌ Failed to parse location update:', parseError);
                setError('Failed to parse location data');
              }
            }
          )
          .subscribe((status) => {
            console.log('📡 Realtime subscription status:', status);
            
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              setError(null);
            } else if (status === 'CHANNEL_ERROR') {
              setIsConnected(false);
              setError('Failed to connect to realtime updates');
            } else if (status === 'TIMED_OUT') {
              setIsConnected(false);
              setError('Connection timed out');
            } else if (status === 'CLOSED') {
              setIsConnected(false);
            }
          });

        // Fetch initial location
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('location')
          .eq('id', barberId)
          .single();

        if (fetchError) {
          console.error('❌ Failed to fetch initial location:', fetchError);
          setError('Failed to fetch initial location');
        } else if (data?.location) {
          const parsed = parseLocation(data.location);
          
          if (parsed) {
            const barberLocation: BarberLocation = {
              latitude: parsed.latitude,
              longitude: parsed.longitude,
              timestamp: new Date(),
            };
            
            setLocation(barberLocation);
            setLastUpdated(new Date());
            
            console.log('✅ Initial barber location loaded:', {
              lat: barberLocation.latitude.toFixed(6),
              lng: barberLocation.longitude.toFixed(6),
            });
          }
        }
      } catch (err) {
        console.error('❌ Error setting up realtime subscription:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsConnected(false);
      }
    };

    setupRealtimeSubscription();

    // Cleanup function
    return () => {
      if (channel) {
        console.log('🔌 Unsubscribing from barber location updates');
        supabase.removeChannel(channel);
        setIsConnected(false);
      }
    };
  }, [barberId, enabled]);

  return {
    location,
    isConnected,
    error,
    lastUpdated,
  };
}
