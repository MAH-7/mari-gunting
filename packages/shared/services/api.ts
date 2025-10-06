import { Barber, Booking, Service, ApiResponse, PaginatedResponse, Review } from '@/types';
import { mockBarbers, mockBarbershopStaff, mockBookings, mockBarbershops, mockReviews, mockServices } from './mockData';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory storage for created bookings (for testing)
const createdBookings: Map<string, Booking> = new Map();

// Helper function to simulate booking completion (FOR TESTING ONLY)
// COMMENTED OUT FOR PRODUCTION - Uncomment for testing rewards system
// export const simulateBookingCompletion = (bookingId: string): boolean => {
//   console.log('🧪 Attempting to complete booking:', bookingId);
//   
//   const booking = createdBookings.get(bookingId);
//   if (booking) {
//     // Create a new booking object with updated status
//     const updatedBooking = {
//       ...booking,
//       status: 'completed' as any,
//       completedAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     };
//     
//     // Update in memory
//     createdBookings.set(bookingId, updatedBooking);
//     
//     console.log('✅ Booking marked as completed:', bookingId);
//     console.log('✅ Updated booking status:', updatedBooking.status);
//     return true;
//   }
//   
//   console.log('❌ Booking not found in createdBookings map');
//   console.log('📋 Available bookings:', Array.from(createdBookings.keys()));
//   return false;
// };

// Mock API endpoints - These will be replaced with real API calls later
export const api = {
  // Barbers
  getBarbers: async (filters?: {
    isOnline?: boolean;
    serviceId?: string;
    location?: { lat: number; lng: number; radius?: number };
  }): Promise<ApiResponse<PaginatedResponse<Barber>>> => {
    await delay(800);
    
    let filteredBarbers = [...mockBarbers];
    
    if (filters?.isOnline !== undefined) {
      filteredBarbers = filteredBarbers.filter(b => b.isOnline === filters.isOnline);
    }
    
    if (filters?.serviceId) {
      filteredBarbers = filteredBarbers.filter(b => 
        b.services.some(s => s.id === filters.serviceId)
      );
    }
    
    return {
      success: true,
      data: {
        data: filteredBarbers,
        total: filteredBarbers.length,
        page: 1,
        pageSize: 20,
        hasMore: false,
      },
    };
  },

  getBarberById: async (id: string): Promise<ApiResponse<any>> => {
    await delay(500);
    
    // First check freelance barbers
    const barber = mockBarbers.find(b => b.id === id);
    if (barber) {
      return {
        success: true,
        data: barber,
      };
    }
    
    // Then check barbershop staff
    const staff = mockBarbershopStaff.find(s => s.id === id);
    if (staff) {
      return {
        success: true,
        data: staff,
      };
    }
    
    return {
      success: false,
      error: 'Barber not found',
    };
  },

  searchBarbers: async (query: string): Promise<ApiResponse<Barber[]>> => {
    await delay(600);
    const results = mockBarbers.filter(b => 
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      b.specializations.some(s => s.toLowerCase().includes(query.toLowerCase()))
    );
    
    return {
      success: true,
      data: results,
    };
  },

  // Reviews
  getReviewsByBarberId: async (barberId: string): Promise<ApiResponse<Review[]>> => {
    await delay(500);
    const reviews = mockReviews.filter(r => r.barberId === barberId);
    
    // Sort by most recent first
    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return {
      success: true,
      data: reviews,
    };
  },

  // Services
  getServices: async (): Promise<ApiResponse<Service[]>> => {
    await delay(500);
    return {
      success: true,
      data: mockServices,
    };
  },

  getServicesByCategory: async (category: string): Promise<ApiResponse<Service[]>> => {
    await delay(500);
    const filtered = mockServices.filter(s => s.category === category);
    return {
      success: true,
      data: filtered,
    };
  },

  // Bookings
  getBookings: async (params?: {
    customerId?: string;
    barberId?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Booking>>> => {
    await delay(700);
    
    let filtered = [...mockBookings];
    
    if (params?.customerId) {
      filtered = filtered.filter(b => b.customerId === params.customerId);
    }
    
    if (params?.barberId) {
      filtered = filtered.filter(b => b.barberId === params.barberId);
    }
    
    if (params?.status) {
      filtered = filtered.filter(b => b.status === params.status);
    }
    
    return {
      success: true,
      data: {
        data: filtered,
        total: filtered.length,
        page: 1,
        pageSize: 20,
        hasMore: false,
      },
    };
  },

  getBookingById: async (id: string): Promise<ApiResponse<Booking>> => {
    await delay(500);
    
    // Check in-memory created bookings first (for Quick Book)
    const createdBooking = createdBookings.get(id);
    if (createdBooking) {
      return {
        success: true,
        data: createdBooking,
      };
    }
    
    // Then check mock bookings
    const booking = mockBookings.find(b => b.id === id);
    
    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }
    
    return {
      success: true,
      data: booking,
    };
  },

  createBooking: async (bookingData: Partial<Booking>): Promise<ApiResponse<Booking>> => {
    await delay(1000);
    
    // Validate booking type
    if (!bookingData.type) {
      return {
        success: false,
        error: 'Booking type is required',
      };
    }
    
    // Set initial status based on booking type
    const initialStatus = bookingData.type === 'scheduled-shop' ? 'pending' : 'pending';
    
    // Simulate creating a booking
    const newBooking: Booking = {
      id: `bk${Date.now()}`,
      ...bookingData,
      status: initialStatus as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Booking;
    
    // Store in memory so it can be retrieved later
    createdBookings.set(newBooking.id, newBooking);
    
    console.log('✅ Booking created and stored:', newBooking.id);
    
    return {
      success: true,
      data: newBooking,
      message: 'Booking created successfully',
    };
  },

  updateBookingStatus: async (
    bookingId: string, 
    status: string
  ): Promise<ApiResponse<Booking>> => {
    await delay(800);
    
    // Check in-memory created bookings first
    const createdBooking = createdBookings.get(bookingId);
    if (createdBooking) {
      const updatedBooking = {
        ...createdBooking,
        status: status as any,
        updatedAt: new Date().toISOString(),
      };
      
      // Update the booking in memory
      createdBookings.set(bookingId, updatedBooking);
      
      console.log('✅ Booking status updated:', bookingId, status);
      
      return {
        success: true,
        data: updatedBooking,
        message: 'Booking status updated',
      };
    }
    
    // Then check mock bookings
    const booking = mockBookings.find(b => b.id === bookingId);
    
    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }
    
    const updatedBooking = {
      ...booking,
      status: status as any,
      updatedAt: new Date().toISOString(),
    };
    
    return {
      success: true,
      data: updatedBooking,
      message: 'Booking status updated',
    };
  },

  cancelBooking: async (
    bookingId: string,
    reason?: string
  ): Promise<ApiResponse<Booking>> => {
    await delay(800);
    
    // Check in-memory created bookings first
    const createdBooking = createdBookings.get(bookingId);
    if (createdBooking) {
      const updatedBooking = {
        ...createdBooking,
        status: 'cancelled' as any,
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason,
        updatedAt: new Date().toISOString(),
      };
      
      // Update the booking in memory
      createdBookings.set(bookingId, updatedBooking);
      
      console.log('✅ Booking cancelled:', bookingId);
      
      return {
        success: true,
        data: updatedBooking,
        message: 'Booking cancelled',
      };
    }
    
    // Then check mock bookings
    const booking = mockBookings.find(b => b.id === bookingId);
    
    if (!booking) {
      return {
        success: false,
        error: 'Booking not found',
      };
    }
    
    const updatedBooking = {
      ...booking,
      status: 'cancelled' as any,
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason,
      updatedAt: new Date().toISOString(),
    };
    
    return {
      success: true,
      data: updatedBooking,
      message: 'Booking cancelled',
    };
  },

  // Quick Book - Find nearest available barber automatically
  quickBook: async (
    serviceId: string,
    time: string
  ): Promise<ApiResponse<{ barber: any }>> => {
    await delay(1500);
    
    // Find an available barber (any online barber for quick book)
    const availableBarber = mockBarbers.find(b => b.isOnline);
    
    if (!availableBarber) {
      return {
        success: false,
        error: 'No available barbers at the moment',
      };
    }
    
    // Return the barber object for navigation to confirm booking screen
    return {
      success: true,
      data: { barber: availableBarber },
      message: 'Barber found! Ready to confirm booking',
    };
  },

  // Barbershops
  getBarbershops: async (filters?: {
    isOpen?: boolean;
    location?: { lat: number; lng: number; radius?: number };
  }): Promise<ApiResponse<PaginatedResponse<any>>> => {
    await delay(800);
    
    let filtered = [...mockBarbershops];
    
    if (filters?.isOpen !== undefined) {
      filtered = filtered.filter(shop => shop.isOpen === filters.isOpen);
    }
    
    return {
      success: true,
      data: {
        data: filtered,
        total: filtered.length,
        page: 1,
        pageSize: 20,
        hasMore: false,
      },
    };
  },

  getBarbershopById: async (id: string): Promise<ApiResponse<any>> => {
    await delay(500);
    const shop = mockBarbershops.find(s => s.id === id);
    
    if (!shop) {
      return {
        success: false,
        error: 'Barbershop not found',
      };
    }
    
    return {
      success: true,
      data: shop,
    };
  },

  getReviewsByBarbershopId: async (shopId: string): Promise<ApiResponse<Review[]>> => {
    await delay(500);
    // For now, return empty reviews for barbershops
    // In production, you would filter reviews by shopId
    const reviews = mockReviews.filter(r => r.barberId === shopId);
    
    // Sort by most recent first
    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return {
      success: true,
      data: reviews,
    };
  },

  getBarbersByShopId: async (shopId: string): Promise<ApiResponse<any[]>> => {
    await delay(600);
    // Return barbershop staff that work at this specific shop
    const staff = mockBarbershopStaff.filter(s => s.barbershopId === shopId);
    
    return {
      success: true,
      data: staff,
    };
  },

  // Get staff member's services from shop catalog
  getStaffServices: async (staffId: string, shopId: string): Promise<ApiResponse<any[]>> => {
    await delay(300);
    
    const staff = mockBarbershopStaff.find(s => s.id === staffId);
    const shop = mockBarbershops.find(s => s.id === shopId);
    
    if (!staff || !shop) {
      return {
        success: false,
        error: 'Staff or shop not found',
      };
    }
    
    // Filter shop services that this staff member can perform
    const availableServices = shop.services.filter(service => 
      staff.serviceIds.includes(service.id)
    );
    
    return {
      success: true,
      data: availableServices,
    };
  },
};
