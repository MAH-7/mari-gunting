import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@mari-gunting/shared';
import * as Location from 'expo-location';

export interface Barbershop {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  images: string[];
  rating: number;
  total_reviews: number;
  is_open: boolean;
  opening_hours: any;
  services: string[];
  distance?: number;
}

interface UseBarbershopsOptions {
  latitude?: number;
  longitude?: number;
  radius?: number; // in km
  searchQuery?: string;
  minRating?: number;
  sortBy?: 'distance' | 'rating' | 'name';
  limit?: number;
}

interface UseBarbershopsReturn {
  barbershops: Barbershop[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export const useBarbershops = (options: UseBarbershopsOptions = {}): UseBarbershopsReturn => {
  const {
    latitude,
    longitude,
    radius = 10,
    searchQuery = '',
    minRating = 0,
    sortBy = 'distance',
    limit = 20,
  } = options;

  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchBarbershops = useCallback(async (isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setIsLoading(true);
        setError(null);
      }

      const currentOffset = isLoadMore ? offset : 0;

      // If we have location, use PostGIS search function
      if (latitude && longitude) {
        const { data, error: rpcError } = await supabase.rpc('search_nearby_barbershops', {
          user_lat: latitude,
          user_lng: longitude,
          search_radius_km: radius,
          search_query: searchQuery || null,
          min_rating: minRating,
          result_limit: limit,
          result_offset: currentOffset,
        });

        if (rpcError) throw rpcError;

        const formattedData: Barbershop[] = data.map((shop: any) => ({
          id: shop.id,
          name: shop.name,
          description: shop.description,
          address: shop.address,
          latitude: shop.latitude,
          longitude: shop.longitude,
          phone: shop.phone,
          images: shop.images || [],
          rating: shop.average_rating || 0,
          total_reviews: shop.total_reviews || 0,
          is_open: shop.is_open || false,
          opening_hours: shop.opening_hours,
          services: shop.services || [],
          distance: shop.distance,
        }));

        if (isLoadMore) {
          setBarbershops(prev => [...prev, ...formattedData]);
        } else {
          setBarbershops(formattedData);
        }

        setHasMore(formattedData.length === limit);
        setOffset(currentOffset + formattedData.length);
      } else {
        // Fallback: Get all barbershops without distance
        let query = supabase
          .from('barbershops')
          .select(`
            *,
            average_rating,
            total_reviews
          `)
          .eq('is_active', true)
          .gte('average_rating', minRating)
          .range(currentOffset, currentOffset + limit - 1);

        // Apply search filter
        if (searchQuery) {
          query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
        }

        // Apply sorting
        switch (sortBy) {
          case 'rating':
            query = query.order('average_rating', { ascending: false });
            break;
          case 'name':
            query = query.order('name', { ascending: true });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }

        const { data, error: selectError } = await query;

        if (selectError) throw selectError;

        const formattedData: Barbershop[] = (data || []).map((shop: any) => ({
          id: shop.id,
          name: shop.name,
          description: shop.description,
          address: shop.address,
          latitude: shop.latitude,
          longitude: shop.longitude,
          phone: shop.phone,
          images: shop.images || [],
          rating: shop.average_rating || 0,
          total_reviews: shop.total_reviews || 0,
          is_open: shop.is_open || false,
          opening_hours: shop.opening_hours,
          services: shop.services || [],
        }));

        if (isLoadMore) {
          setBarbershops(prev => [...prev, ...formattedData]);
        } else {
          setBarbershops(formattedData);
        }

        setHasMore(formattedData.length === limit);
        setOffset(currentOffset + formattedData.length);
      }
    } catch (err) {
      console.error('Error fetching barbershops:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, radius, searchQuery, minRating, sortBy, limit, offset]);

  const refetch = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    await fetchBarbershops(false);
  }, [fetchBarbershops]);

  const loadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await fetchBarbershops(true);
    }
  }, [isLoading, hasMore, fetchBarbershops]);

  useEffect(() => {
    fetchBarbershops(false);
  }, [latitude, longitude, radius, searchQuery, minRating, sortBy]);

  return {
    barbershops,
    isLoading,
    error,
    refetch,
    hasMore,
    loadMore,
  };
};

// Hook to get current user location
export const useUserLocation = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          throw new Error('Location permission not granted');
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      } catch (err) {
        console.error('Error getting location:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { location, isLoading, error };
};
