// User Types
export type UserRole = 'customer' | 'barber';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
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
  isVerified: boolean;
  joinedDate: string;
  photos: string[];
  specializations: string[];
  distance?: number;
}

export interface Barbershop {
  id: string;
  name: string;
  image: string;
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
export type BookingStatus = 
  | 'pending'
  | 'accepted'
  | 'on-the-way'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

export interface Booking {
  id: string;
  customerId: string;
  customerName?: string;
  customer?: Customer;
  barberId: string;
  barberName?: string;
  barberAvatar?: string;
  barber?: Barber;
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
