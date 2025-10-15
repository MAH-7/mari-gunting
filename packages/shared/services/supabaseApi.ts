import { supabase } from '../config/supabase';
import { ApiResponse, PaginatedResponse } from '../types';
import { Profile, Barber as DBBarber, Service as DBService } from '../types/database';

/**
 * Parse PostGIS location data to lat/lng coordinates
 * Supports: WKB hex format, POINT text format, and GeoJSON
 */
export function parseLocation(locationData: any): { latitude: number; longitude: number } | null {
  // Default fallback location (KL center)
  const defaultLocation = { latitude: 3.1569, longitude: 101.7123 };
  
  if (!locationData) {
    return defaultLocation;
  }

  try {
    if (typeof locationData === 'string' && locationData.startsWith('POINT(')) {
      // PostGIS POINT text format: "POINT(lng lat)"
      const coordsMatch = locationData.match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/);
      if (coordsMatch) {
        return {
          longitude: parseFloat(coordsMatch[1]),
          latitude: parseFloat(coordsMatch[2]),
        };
      }
    } else if (typeof locationData === 'string' && locationData.match(/^[0-9A-F]+$/i)) {
      // WKB hex format - decode directly
      // PostGIS EWKB format with SRID: byte order + type marker + SRID + coordinates
      try {
        const hex = locationData;
        // Skip: byte order (2) + geometry type (8) + SRID (8) = 18 chars
        const startIndex = 18;
        
        // Read longitude (8 bytes = 16 hex chars)
        const lngHex = hex.substring(startIndex, startIndex + 16);
        // Read latitude (8 bytes = 16 hex chars)  
        const latHex = hex.substring(startIndex + 16, startIndex + 32);
        
        // Convert little-endian hex to double
        const hexToDouble = (hexStr: string): number => {
          const bytes = [];
          for (let i = 0; i < 16; i += 2) {
            bytes.push(parseInt(hexStr.substr(i, 2), 16));
          }
          const buffer = new Uint8Array(bytes);
          const view = new DataView(buffer.buffer);
          return view.getFloat64(0, true); // true = little-endian
        };
        
        return {
          longitude: hexToDouble(lngHex),
          latitude: hexToDouble(latHex),
        };
      } catch (decodeError) {
        console.warn('Failed to decode WKB location:', decodeError);
        return defaultLocation;
      }
    } else {
      // Try parsing as GeoJSON
      const geoJSON = typeof locationData === 'string' 
        ? JSON.parse(locationData) 
        : locationData;
      if (geoJSON && geoJSON.coordinates) {
        return {
          longitude: geoJSON.coordinates[0],
          latitude: geoJSON.coordinates[1],
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse location:', e);
    return defaultLocation;
  }

  return defaultLocation;
}

// Transform database types to app types
interface BarberWithProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'barber';
  avatar: string;
  bio: string;
  rating: number;
  totalReviews: number;
  completedJobs: number;
  services: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    category: string;
    image?: string;
    is_popular?: boolean;
  }>;
  availability: any;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  isOnline: boolean;
  isAvailable: boolean;
  isVerified: boolean;
  joinedDate: string;
  photos: string[];
  specializations: string[];
  distance?: number;
  createdAt: string;
}

// Helper to transform DB barber + profile to app Barber type
function transformBarberData(
  barber: DBBarber,
  profile: Profile,
  services: DBService[],
  distance?: number
): BarberWithProfile {
  // Parse location from PostGIS using exported parseLocation utility
  const locationData = (profile as any).location_text || profile.location;
  const parsedLocation = parseLocation(locationData);
  
  const location = {
    latitude: parsedLocation?.latitude || 3.1569,
    longitude: parsedLocation?.longitude || 101.7123,
    address: profile.address_line1 || undefined,
  };

  return {
    id: barber.id,
    name: profile.full_name,
    email: profile.email || '',
    phone: profile.phone_number || '',
    role: 'barber',
    avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    bio: barber.bio || '',
    rating: barber.rating || 0,
    totalReviews: barber.total_reviews || 0,
    completedJobs: barber.completed_bookings || 0,
    services: services.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description || '',
      price: s.price,
      duration: s.duration_minutes,
      category: s.category || 'haircut',
      image: s.image_url || undefined,
      is_popular: s.is_popular || false,
    })),
    availability: barber.working_hours || {},
    location,
    isOnline: profile.is_online,
    isAvailable: barber.is_available,
    isVerified: barber.is_verified,
    serviceRadiusKm: barber.service_radius_km || 20, // Default 20km if not set
    joinedDate: barber.created_at,
    photos: barber.portfolio_images || [],
    specializations: barber.specializations || [],
    distance,
    createdAt: barber.created_at,
  };
}

// Supabase API
export const supabaseApi = {
  /**
   * Get barbers with filters
   */
  getBarbers: async (filters?: {
    isOnline?: boolean;
    isAvailable?: boolean;
    serviceId?: string;
    location?: { lat: number; lng: number; radius?: number };
  }): Promise<ApiResponse<PaginatedResponse<BarberWithProfile>>> => {
    try {
      console.log('🔍 Fetching barbers from Supabase with filters:', filters);

      let barbersData: any[];
      let error: any;

      // Use PostGIS function if location is provided (OPTIMIZED)
      if (filters?.location) {
        const { lat, lng, radius = 5 } = filters.location;
        
        console.log(`📍 Using PostGIS geospatial query (lat: ${lat}, lng: ${lng}, radius: ${radius}km)`);
        
        const { data, error: rpcError } = await supabase
          .rpc('get_nearby_barbers', {
            customer_lat: lat,
            customer_lng: lng,
            radius_km: radius,
            buffer_multiplier: 1.5 // Pre-filter with 1.5x buffer
          });
        
        barbersData = data;
        error = rpcError;
        
        if (data) {
          console.log(`✅ PostGIS returned ${data.length} nearby barbers (pre-filtered)`);
        }
      } else {
        // Fall back to regular query if no location provided
        console.log('📍 No location provided, fetching all barbers');
        
        let query = supabase
          .from('barbers')
          .select(`
            *,
            profile:profiles!barbers_user_id_fkey(
              *,
              location_text:location::text
            )
          `);

        // Filter by availability
        if (filters?.isAvailable !== undefined) {
          query = query.eq('is_available', filters.isAvailable);
        }

        const result = await query;
        barbersData = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Error fetching barbers:', error);
        throw error;
      }

      if (!barbersData || barbersData.length === 0) {
        console.log('ℹ️ No barbers found');
        return {
          success: true,
          data: {
            data: [],
            total: 0,
            page: 1,
            pageSize: 20,
            hasMore: false,
          },
        };
      }

      // Fetch services for each barber
      const barberIds = barbersData.map((b: any) => b.id);
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .in('barber_id', barberIds)
        .eq('is_active', true);

      if (servicesError) {
        console.error('❌ Error fetching services:', servicesError);
      }

      // Group services by barber_id
      const servicesByBarber = (servicesData || []).reduce((acc: any, service: any) => {
        if (!acc[service.barber_id]) {
          acc[service.barber_id] = [];
        }
        acc[service.barber_id].push(service);
        return acc;
      }, {});

      // Transform data based on source (PostGIS function vs regular query)
      const transformedBarbers = barbersData.map((barber: any) => {
        // PostGIS function returns flattened data
        if (filters?.location) {
          return {
            id: barber.id,
            name: barber.name,
            email: '',
            phone: barber.phone_number || '',
            role: 'barber' as const,
            avatar: barber.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
            bio: barber.bio || '',
            rating: barber.average_rating || 0,
            totalReviews: barber.total_reviews || 0,
            completedJobs: 0,
            services: (servicesByBarber[barber.id] || []).map((s: any) => ({
              id: s.id,
              name: s.name,
              description: s.description || '',
              price: s.price,
              duration: s.duration_minutes,
              category: s.category || 'haircut',
              image: s.image_url || undefined,
              is_popular: s.is_popular || false,
            })),
            availability: {},
            location: {
              latitude: barber.location_lat,
              longitude: barber.location_lng,
            },
            isOnline: barber.is_online,
            isAvailable: barber.is_available,
            isVerified: true,
            serviceRadiusKm: barber.service_radius_km || 20,
            joinedDate: barber.created_at || new Date().toISOString(),
            photos: barber.portfolio_urls || [],
            specializations: barber.specializations || [],
            distance: barber.straight_line_distance_km, // Straight-line distance from PostGIS
            createdAt: barber.created_at || new Date().toISOString(),
          };
        } else {
          // Regular query format with nested profile
          return transformBarberData(
            barber,
            barber.profile,
            servicesByBarber[barber.id] || [],
            undefined
          );
        }
      });

      // Filter by serviceId if provided
      let finalBarbers = transformedBarbers;
      if (filters?.serviceId) {
        finalBarbers = transformedBarbers.filter((b: any) =>
          b.services.some((s: any) => s.id === filters.serviceId)
        );
      }

      console.log(`✅ Found ${finalBarbers.length} barbers`);

      return {
        success: true,
        data: {
          data: finalBarbers,
          total: finalBarbers.length,
          page: 1,
          pageSize: 20,
          hasMore: false,
        },
      };
    } catch (error: any) {
      console.error('❌ Error in getBarbers:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch barbers',
      };
    }
  },

  /**
   * Get barber by ID
   */
  getBarberById: async (id: string): Promise<ApiResponse<BarberWithProfile>> => {
    try {
      console.log('🔍 Fetching barber by ID:', id);

      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .select(`
          *,
          profile:profiles!barbers_user_id_fkey(*)
        `)
        .eq('id', id)
        .single();

      if (barberError) {
        console.error('❌ Error fetching barber:', barberError);
        throw barberError;
      }

      if (!barberData || !barberData.profile) {
        return {
          success: false,
          error: 'Barber not found',
        };
      }

      // Fetch barber's services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', id)
        .eq('is_active', true);

      if (servicesError) {
        console.error('❌ Error fetching services:', servicesError);
      }

      const transformedBarber = transformBarberData(
        barberData,
        barberData.profile,
        servicesData || []
      );

      console.log('✅ Barber found:', transformedBarber.name);

      return {
        success: true,
        data: transformedBarber,
      };
    } catch (error: any) {
      console.error('❌ Error in getBarberById:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch barber',
      };
    }
  },

  /**
   * Search barbers by query
   */
  searchBarbers: async (query: string): Promise<ApiResponse<BarberWithProfile[]>> => {
    try {
      console.log('🔍 Searching barbers with query:', query);

      const { data: barbersData, error } = await supabase
        .from('barbers')
        .select(`
          *,
          profile:profiles!barbers_user_id_fkey(*)
        `);

      if (error) {
        console.error('❌ Error searching barbers:', error);
        throw error;
      }

      if (!barbersData || barbersData.length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      // Filter by query (name or specializations)
      const filteredBarbers = barbersData.filter((b: any) => {
        if (!b.profile) return false;
        
        const nameMatch = b.profile.full_name?.toLowerCase().includes(query.toLowerCase());
        const specializationMatch = b.specializations?.some((s: string) =>
          s.toLowerCase().includes(query.toLowerCase())
        );
        
        return nameMatch || specializationMatch;
      });

      // Fetch services for filtered barbers
      const barberIds = filteredBarbers.map((b: any) => b.id);
      if (barberIds.length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .in('barber_id', barberIds)
        .eq('is_active', true);

      if (servicesError) {
        console.error('❌ Error fetching services:', servicesError);
      }

      // Group services by barber_id
      const servicesByBarber = (servicesData || []).reduce((acc: any, service: any) => {
        if (!acc[service.barber_id]) {
          acc[service.barber_id] = [];
        }
        acc[service.barber_id].push(service);
        return acc;
      }, {});

      // Transform data
      const transformedBarbers = filteredBarbers.map((barber: any) =>
        transformBarberData(
          barber,
          barber.profile,
          servicesByBarber[barber.id] || []
        )
      );

      console.log(`✅ Found ${transformedBarbers.length} barbers matching query`);

      return {
        success: true,
        data: transformedBarbers,
      };
    } catch (error: any) {
      console.error('❌ Error in searchBarbers:', error);
      return {
        success: false,
        error: error.message || 'Failed to search barbers',
      };
    }
  },

  /**
   * Quick Book - Find nearest available barber
   */
  quickBook: async (
    serviceId: string,
    time: string
  ): Promise<ApiResponse<{ barber: BarberWithProfile }>> => {
    try {
      console.log('🔍 Finding available barber for quick book');

      // Find online and available barbers
      const { data: barbersData, error } = await supabase
        .from('barbers')
        .select(`
          *,
          profile:profiles!barbers_user_id_fkey(*)
        `)
        .eq('is_available', true);

      if (error) {
        console.error('❌ Error finding barbers:', error);
        throw error;
      }

      // Filter by profile.is_online
      const availableBarbers = (barbersData || []).filter((b: any) =>
        b.profile?.is_online === true
      );

      if (availableBarbers.length === 0) {
        return {
          success: false,
          error: 'No available barbers at the moment',
        };
      }

      // Get first available barber (in production, use location-based sorting)
      const barber = availableBarbers[0];

      // Fetch services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', barber.id)
        .eq('is_active', true);

      const transformedBarber = transformBarberData(
        barber,
        barber.profile,
        servicesData || []
      );

      console.log('✅ Found available barber:', transformedBarber.name);

      return {
        success: true,
        data: { barber: transformedBarber },
        message: 'Barber found! Ready to confirm booking',
      };
    } catch (error: any) {
      console.error('❌ Error in quickBook:', error);
      return {
        success: false,
        error: error.message || 'Failed to find available barber',
      };
    }
  },

  /**
   * Get reviews by barber ID
   */
  getReviewsByBarberId: async (barberId: string): Promise<ApiResponse<any[]>> => {
    try {
      console.log('🔍 Fetching reviews for barber:', barberId);

      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          response,
          response_at,
          created_at,
          bookings (
            id,
            customer_id,
            profiles (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('barber_id', barberId)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching reviews:', error);
        throw error;
      }

      if (!reviews || reviews.length === 0) {
        console.log('ℹ️ No reviews found for barber:', barberId);
        return {
          success: true,
          data: [],
        };
      }

      // Transform to match expected Review interface
      const transformedReviews = reviews.map((review: any) => ({
        id: review.id,
        barberId,
        customerName: review.bookings?.profiles?.full_name || 'Anonymous',
        customerAvatar: review.bookings?.profiles?.avatar_url || null,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        response: review.response ? {
          text: review.response,
          date: review.response_at || review.created_at,
        } : null,
      }));

      console.log(`✅ Found ${transformedReviews.length} reviews`);

      return {
        success: true,
        data: transformedReviews,
      };
    } catch (error: any) {
      console.error('❌ Error in getReviewsByBarberId:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch reviews',
      };
    }
  },
};
