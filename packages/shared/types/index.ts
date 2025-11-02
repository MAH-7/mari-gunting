// User Types
export type UserRole = 'customer' | 'barber';

export interface User {
  id: string;
  full_name: string;  // Changed from 'name' to match database
  email: string;
  phone_number: string;  // Changed from 'phone' to match database
  role: UserRole; // DEPRECATED: Use 'roles' array instead. Kept for backward compatibility.
  roles: UserRole[]; // NEW: Support multiple roles (e.g., ['customer', 'barber'])
  avatar_url?: string;  // Changed from 'avatar' to match database
  created_at: string;  // Changed from 'createdAt' to match database
}

export interface Customer extends User {
  role: 'customer';
  address?: Address;
  savedAddresses: Address[];
}

export interface Barber extends User {
  role: 'barber';
  bio: string;
  rating: number;
  totalReviews: number;
  completedJobs: number;
  services: Service[];
  availability: BarberAvailability;
  location: Location;
  isOnline: boolean;
  isAvailable: boolean;       // Whether barber is available for bookings
  isVerified: boolean;
  joinedDate: string;
  photos: string[];
  specializations: string[];
  serviceRadiusKm: number;    // How far barber will travel (in km)
  distance?: number;          // DRIVING distance from customer (in km)
  durationMinutes?: number;   // Estimated driving time to customer (in minutes)
}

export interface Barbershop {
  id: string;
  name: string;
  image: string;
  logo: string;
  photos?: string[]; // Array of additional photos for the image carousel
  rating: number;
  reviewsCount: number;
  address: string;
  distance?: number;
  isOpen: boolean;
  isVerified: boolean;
  operatingHours: string;
  bookingsCount: number;
  services: {
    id: string;
    name: string;
    price: number;
    duration: number;
  }[];
}

// Barbershop Staff (Shop Employees)
// These are DIFFERENT from freelance Barbers - they work at physical shop locations
export interface BarbershopStaff {
  id: string;
  barbershopId: string;          // Which shop they work at (required)
  employeeNumber?: string;        // Shop's internal employee ID
  
  // Personal Info
  name: string;
  avatar: string;
  bio: string;
  email?: string;
  phone?: string;
  
  // Performance Metrics (specific to this barbershop)
  rating: number;                 // Rating from customers at THIS shop
  totalReviews: number;           // Total reviews at THIS shop
  completedJobs: number;          // Jobs completed at THIS shop
  joinedDate: string;             // When they joined THIS shop
  
  // Skills & Portfolio
  specializations: string[];      // e.g., ['Modern Cuts', 'Fade', 'Beard Styling']
  certifications?: string[];      // Professional certifications
  photos?: string[];              // Portfolio photos of their work
  
  // Services (references shop's service catalog)
  // Staff can perform these services at the SHOP'S PRICES (not their own)
  serviceIds: string[];           // IDs of shop services this staff can perform
  // Note: Actual prices come from the barbershop's service catalog
  
  // Work Schedule (at this shop)
  workSchedule?: {
    monday: TimeSlot[];
    tuesday: TimeSlot[];
    wednesday: TimeSlot[];
    thursday: TimeSlot[];
    friday: TimeSlot[];
    saturday: TimeSlot[];
    sunday: TimeSlot[];
  };
  
  // Status
  isAvailable: boolean;           // Currently available at the shop
  isVerified: boolean;            // Verified by platform
  
  // NOTE: Fields NOT needed for shop staff (different from freelance Barbers):
  // - NO location (they work at shop's fixed location)
  // - NO distance (customer goes to shop, not calculated)
  // - NO isOnline (they're at the shop during work hours)
  // - NO availability for mobile service (walk-in only)
}

// Address & Location
export interface Address {
  id: string;
  label: string; // 'Home', 'Office', etc.
  fullAddress: string;
  latitude: number;
  longitude: number;
  notes?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: ServiceCategory;
  image?: string;
}

export type ServiceCategory = 
  | 'haircut'
  | 'shave'
  | 'beard-trim'
  | 'hair-coloring'
  | 'styling'
  | 'kids-haircut'
  | 'premium';

// Booking Types
export type BookingType = 
  | 'on-demand'        // Quick Book / Choose Barber (ASAP, barber travels to customer)
  | 'scheduled-shop'   // Barbershop (scheduled appointment, customer walks in)
  | 'scheduled-home';  // Future: Scheduled home service

export type BookingStatus = 
  | 'pending'
  | 'accepted'
  | 'confirmed'         // For barbershop bookings
  | 'ready'             // For barbershop: ready for customer
  | 'on-the-way'
  | 'arrived'           // Partner has arrived at location
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'          // Barber declined the booking
  | 'expired';          // Auto-expired after 3 minutes no response

export interface Booking {
  id: string;
  type: BookingType;     // Booking type: on-demand, scheduled-shop, or scheduled-home
  customerId: string;
  customerName?: string;
  customer?: Customer;
  barberId: string;
  barberName?: string;
  barberAvatar?: string;
  barber?: Barber;
  
  // Barbershop-specific fields
  shopId?: string;       // For barbershop bookings
  shopName?: string;     // Shop name
  shopAddress?: string;  // Shop physical address
  shopPhone?: string;    // Shop contact number
  
  serviceId?: string;
  serviceName?: string;
  services?: Service[];
  price?: number;
  duration?: number;
  scheduledAt?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  status: BookingStatus;
  location?: Location;
  address?: Address;
  totalPrice?: number;
  distance?: number; // distance in km
  travelCost?: number; // auto-calculated based on distance
  platformFee?: number; // platform fee (RM 2.00)
  serviceCommission?: number; // 12% commission from service price
  barberServiceEarning?: number; // 88% of service price that barber keeps
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  payment?: Payment;
  review?: Review;
}

// Payment Types
export type PaymentMethod = 'cash' | 'card' | 'e-wallet';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt?: string;
}

// Review Types
export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  barberId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
  customerName?: string;
  customerAvatar?: string;
}

// Availability
export interface BarberAvailability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;
}

// Notification Types
export type NotificationType = 
  | 'booking-request'
  | 'booking-accepted'
  | 'booking-cancelled'
  | 'barber-on-the-way'
  | 'service-started'
  | 'service-completed'
  | 'payment-received'
  | 'review-received';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  bookingId?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
