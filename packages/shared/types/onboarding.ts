/**
 * Partner Onboarding Types
 * Production-grade onboarding state management
 */

export type OnboardingStatus =
  | 'not_started'
  | 'phone_verified'
  | 'account_type_selected'
  | 'ekyc_submitted'
  | 'ekyc_passed'
  | 'business_submitted'
  | 'business_verified'
  | 'payout_submitted'
  | 'payout_verified'
  | 'services_completed'
  | 'availability_completed'
  | 'portfolio_completed'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'needs_more_info';

export type AccountType = 'freelance' | 'barbershop';

export interface OnboardingProgress {
  status: OnboardingStatus;
  accountType?: AccountType;
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  phoneNumber?: string;
  lastUpdatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectionReason?: string;
  missingFields?: string[];
}

// eKYC Data
export interface EKYCData {
  nricNumber?: string; // Last 4 digits only for display
  fullName: string;
  dateOfBirth?: string;
  selfieUrl?: string;
  nricFrontUrl?: string;
  nricBackUrl?: string;
  livenessScore?: number;
  verificationStatus?: 'pending' | 'verified' | 'failed';
  verifiedAt?: string;
}

// Business Details (Barbershop)
export interface BusinessDetails {
  ssmNumber?: string;
  businessName: string;
  businessType: 'sole_proprietor' | 'partnership' | 'sdn_bhd' | 'other';
  registrationCertUrl?: string;
  businessLicenseUrl?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  latitude?: number;
  longitude?: number;
  verificationStatus?: 'pending' | 'verified' | 'failed';
  verifiedAt?: string;
}

// Payout Details
export interface PayoutDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string; // Encrypted on backend
  accountNumberMasked?: string; // e.g., ****1234
  duitNowId?: string;
  bankVerificationStatus?: 'pending' | 'verified' | 'failed';
  verifiedAt?: string;
}

// Service Configuration
export interface ServiceItem {
  id: string;
  category: 'haircut' | 'beard' | 'shave' | 'coloring' | 'styling' | 'other';
  name: string;
  description: string;
  basePrice: number;
  duration: number; // minutes
  isActive: boolean;
}

export interface ServicesConfig {
  services: ServiceItem[];
  specializations: string[];
  minimumBookingNotice: number; // hours
  cancellationPolicy: string;
}

// Availability Configuration (Freelance)
export interface FreelanceAvailability {
  serviceRadius: number; // km
  travelFeePerKm: number;
  minimumTravelFee: number;
  preferredAreas: string[];
  weeklySchedule: {
    [key: string]: {
      isAvailable: boolean;
      slots: { start: string; end: string }[];
    };
  };
  blackoutDates: string[]; // ISO dates
}

// Operating Hours (Barbershop)
export interface ShopOperatingHours {
  [day: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
    breakTime?: { start: string; end: string };
  };
  capacity: number; // Number of chairs/barbers
  allowWalkIns: boolean;
  advanceBookingDays: number;
}

// Portfolio
export interface PortfolioItem {
  id: string;
  imageUrl: string;
  caption?: string;
  serviceCategory?: string;
  uploadedAt: string;
  moderationStatus: 'pending' | 'approved' | 'rejected';
}

export interface Portfolio {
  items: PortfolioItem[];
  bio: string;
  experience: string;
  certifications: string[];
}

// Complete Onboarding Data
export interface CompleteOnboardingData {
  progress: OnboardingProgress;
  ekyc?: EKYCData;
  business?: BusinessDetails;
  payout?: PayoutDetails;
  services?: ServicesConfig;
  availability?: FreelanceAvailability;
  operatingHours?: ShopOperatingHours;
  portfolio?: Portfolio;
  consents: {
    termsAcceptedAt?: string;
    pdpaAcceptedAt?: string;
    tosVersion?: string;
  };
}

// Step definitions for routing
export interface OnboardingStep {
  id: string;
  route: string;
  title: string;
  description: string;
  isRequired: boolean;
  accountTypes: AccountType[];
  order: number;
}

// Form validation errors
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isValid: boolean;
}
