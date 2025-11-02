import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { uploadFile, convertToJpg } from './storage';

// =====================================================
// TYPES
// =====================================================

export interface BarberOnboardingData {
  basicInfo?: {
    bio: string;
    experience: number;
    specializations: string[];
  };
  ekyc?: {
    icNumber: string;
    icFrontUrl: string;
    icBackUrl: string;
    selfieUrl: string;
    certificateUrls: string[];
  };
  serviceDetails?: {
    radius: number;
    hours: Record<string, { start: string; end: string; isAvailable: boolean }>;
    portfolioUrls: string[];
  };
  payout?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export interface BarbershopOnboardingData {
  businessInfo?: {
    name: string;
    description: string;
    phoneNumber: string;
    email: string;
    ssmNumber?: string;
  };
  location?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    latitude: number;
    longitude: number;
  };
  documents?: {
    logoUrl?: string;
    coverImageUrls: string[];
    ssmDocUrl?: string;
    businessLicenseUrl?: string;
  };
  operatingHours?: Record<string, { start: string; end: string; isOpen: boolean }>;
  staffServices?: {
    staff: Array<{ name: string; role: string; specializations: string[] }>;
    services: Array<{ name: string; price: number; duration: number }>;
  };
  amenities?: string[];
  payout?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

// =====================================================
// BARBER ONBOARDING SERVICE
// =====================================================

export const barberOnboardingService = {
  /**
   * Save progress for a specific step
   */
  async saveProgress(step: keyof BarberOnboardingData, data: any, updateStep: boolean = true): Promise<void> {
    try {
      const key = `onboarding_barber_${step}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
      
      // Track current step (only when user actually saves, not when loading from DB)
      if (updateStep) {
        const stepOrder: Array<keyof BarberOnboardingData> = ['basicInfo', 'ekyc', 'serviceDetails', 'payout'];
        const stepIndex = stepOrder.indexOf(step);
        if (stepIndex >= 0) {
          await AsyncStorage.setItem('onboarding_barber_currentStep', stepIndex.toString());
        }
      }
    } catch (error) {
      console.error(`Error saving barber progress (${step}):`, error);
      throw error;
    }
  },

  /**
   * Get the last completed step index (0-3)
   */
  async getCurrentStep(): Promise<number> {
    try {
      const step = await AsyncStorage.getItem('onboarding_barber_currentStep');
      return step ? parseInt(step, 10) : 0;
    } catch (error) {
      return 0;
    }
  },

  /**
   * Get all saved progress
   */
  async getProgress(): Promise<BarberOnboardingData> {
    try {
      const steps: Array<keyof BarberOnboardingData> = ['basicInfo', 'ekyc', 'serviceDetails', 'payout'];
      const data: BarberOnboardingData = {};

      for (const step of steps) {
        const key = `onboarding_barber_${step}`;
        const saved = await AsyncStorage.getItem(key);
        if (saved) {
          data[step] = JSON.parse(saved);
        }
      }

      return data;
    } catch (error) {
      console.error('Error getting barber progress:', error);
      return {};
    }
  },

  /**
   * Clear all saved progress
   */
  async clearProgress(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'onboarding_barber_basicInfo',
        'onboarding_barber_ekyc',
        'onboarding_barber_serviceDetails',
        'onboarding_barber_payout',
        'onboarding_barber_currentStep',
      ]);
    } catch (error) {
      console.error('Error clearing barber progress:', error);
    }
  },

  /**
   * Submit complete onboarding data
   */
  async submitOnboarding(userId: string, data: BarberOnboardingData): Promise<{ success: boolean; error?: string }> {
    try {
      if (!data.basicInfo || !data.ekyc || !data.serviceDetails || !data.payout) {
        return { success: false, error: 'Incomplete onboarding data' };
      }

      // Prepare verification documents JSONB
      const documents = {
        ic_front: data.ekyc.icFrontUrl,
        ic_back: data.ekyc.icBackUrl,
        selfie: data.ekyc.selfieUrl,
        certificates: data.ekyc.certificateUrls || [],
      };

      // Update barber record with complete data
      const { error } = await supabase
        .from('barbers')
        .update({
          bio: data.basicInfo.bio,
          experience_years: data.basicInfo.experience,
          specializations: data.basicInfo.specializations,
          service_radius_km: data.serviceDetails.radius,
          working_hours: data.serviceDetails.hours,
          portfolio_images: data.serviceDetails.portfolioUrls,
          bank_name: data.payout.bankName,
          bank_account_number: data.payout.accountNumber,
          bank_account_name: data.payout.accountName,
          ic_number: data.ekyc.icNumber,
          verification_documents: documents,
          verification_status: 'pending', // ✅ Ready for admin review
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
      }

      // Clear saved progress after successful submission
      await this.clearProgress();

      return { success: true };
    } catch (error: any) {
      console.error('Error submitting barber onboarding:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  },
};

// =====================================================
// BARBERSHOP ONBOARDING SERVICE
// =====================================================

export const barbershopOnboardingService = {
  /**
   * Save progress for a specific step
   */
  async saveProgress(step: keyof BarbershopOnboardingData, data: any): Promise<void> {
    try {
      const key = `onboarding_barbershop_${step}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving barbershop progress (${step}):`, error);
      throw error;
    }
  },

  /**
   * Get all saved progress
   */
  async getProgress(): Promise<BarbershopOnboardingData> {
    try {
      const steps: Array<keyof BarbershopOnboardingData> = [
        'businessInfo',
        'location',
        'documents',
        'operatingHours',
        'staffServices',
        'amenities',
        'payout',
      ];
      const data: BarbershopOnboardingData = {};

      for (const step of steps) {
        const key = `onboarding_barbershop_${step}`;
        const saved = await AsyncStorage.getItem(key);
        if (saved) {
          data[step] = JSON.parse(saved);
        }
      }

      return data;
    } catch (error) {
      console.error('Error getting barbershop progress:', error);
      return {};
    }
  },

  /**
   * Clear all saved progress
   */
  async clearProgress(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'onboarding_barbershop_businessInfo',
        'onboarding_barbershop_location',
        'onboarding_barbershop_documents',
        'onboarding_barbershop_operatingHours',
        'onboarding_barbershop_staffServices',
        'onboarding_barbershop_amenities',
        'onboarding_barbershop_payout',
      ]);
    } catch (error) {
      console.error('Error clearing barbershop progress:', error);
    }
  },

  /**
   * Submit complete onboarding data
   */
  async submitOnboarding(
    userId: string,
    data: BarbershopOnboardingData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (
        !data.businessInfo ||
        !data.location ||
        !data.operatingHours ||
        !data.staffServices ||
        !data.payout
      ) {
        return { success: false, error: 'Incomplete onboarding data' };
      }

      // Prepare verification documents JSONB
      const documents = {
        logo: data.documents?.logoUrl || null,
        cover_images: data.documents?.coverImageUrls || [],
        ssm_document: data.documents?.ssmDocUrl || null,
        business_license: data.documents?.businessLicenseUrl || null,
      };

      // Create location point for PostGIS
      const locationPoint = `POINT(${data.location.longitude} ${data.location.latitude})`;

      // Update or insert barbershop record
      const { error } = await supabase
        .from('barbershops')
        .upsert({
          owner_id: userId,
          name: data.businessInfo.name,
          description: data.businessInfo.description,
          phone_number: data.businessInfo.phoneNumber,
          email: data.businessInfo.email,
          ssm_number: data.businessInfo.ssmNumber,
          address_line1: data.location.addressLine1,
          address_line2: data.location.addressLine2,
          city: data.location.city,
          state: data.location.state,
          postal_code: data.location.postalCode,
          location: locationPoint,
          opening_hours: data.operatingHours,
          verification_documents: documents,
          logo_url: data.documents?.logoUrl,
          cover_images: data.documents?.coverImageUrls || [],
          amenities: data.amenities || [],
          bank_name: data.payout.bankName,
          bank_account_number: data.payout.accountNumber,
          bank_account_name: data.payout.accountName,
          verification_status: 'pending', // ✅ Ready for admin review
          updated_at: new Date().toISOString(),
        })
        .eq('owner_id', userId);

      if (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
      }

      // Insert staff and services (if applicable)
      // This would require separate tables/logic - implement based on schema

      // Clear saved progress after successful submission
      await this.clearProgress();

      return { success: true };
    } catch (error: any) {
      console.error('Error submitting barbershop onboarding:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  },
};

// =====================================================
// LOAD PROGRESS FROM DATABASE
// =====================================================

/**
 * Load barber onboarding progress from database and populate AsyncStorage
 */
export async function loadBarberProgressFromDB(userId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.log('No barber record found, starting fresh onboarding');
      return;
    }

    // Reconstruct onboarding data from database
    const progress: BarberOnboardingData = {};

    // Basic Info
    if (data.bio || data.experience_years || data.specializations) {
      progress.basicInfo = {
        bio: data.bio || '',
        experience: data.experience_years || 0,
        specializations: data.specializations || [],
      };
      await barberOnboardingService.saveProgress('basicInfo', progress.basicInfo, false);
    }

    // eKYC
    const docs = data.verification_documents as any;
    if (docs && (docs.ic_front || docs.ic_back || docs.selfie)) {
      progress.ekyc = {
        icNumber: data.ic_number || '',
        icFrontUrl: docs.ic_front || '',
        icBackUrl: docs.ic_back || '',
        selfieUrl: docs.selfie || '',
        certificateUrls: docs.certificates || [],
      };
      await barberOnboardingService.saveProgress('ekyc', progress.ekyc, false);
    }

    // Service Details
    if (data.service_radius_km || data.working_hours || data.portfolio_images) {
      progress.serviceDetails = {
        radius: data.service_radius_km || 5,
        hours: data.working_hours || {},
        portfolioUrls: data.portfolio_images || [],
      };
      await barberOnboardingService.saveProgress('serviceDetails', progress.serviceDetails, false);
    }

    // Payout
    if (data.bank_name || data.bank_account_number) {
      progress.payout = {
        bankName: data.bank_name || '',
        accountNumber: data.bank_account_number || '',
        accountName: data.bank_account_name || '',
      };
      await barberOnboardingService.saveProgress('payout', progress.payout, false);
    }

    // Determine current step based on what data exists
    let currentStep = 0;
    if (progress.payout) currentStep = 3;
    else if (progress.serviceDetails) currentStep = 2;
    else if (progress.ekyc) currentStep = 1;
    else if (progress.basicInfo) currentStep = 0;
    
    await AsyncStorage.setItem('onboarding_barber_currentStep', currentStep.toString());
    console.log('✅ Loaded barber progress from database - current step:', currentStep);
  } catch (error) {
    console.error('Error loading barber progress from DB:', error);
  }
}

/**
 * Load barbershop onboarding progress from database and populate AsyncStorage
 */
export async function loadBarbershopProgressFromDB(userId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('barbershops')
      .select('*')
      .eq('owner_id', userId)
      .single();

    if (error || !data) {
      console.log('No barbershop record found, starting fresh onboarding');
      return;
    }

    // Reconstruct onboarding data from database
    const progress: BarbershopOnboardingData = {};

    // Business Info
    if (data.name || data.description) {
      progress.businessInfo = {
        name: data.name || '',
        description: data.description || '',
        phoneNumber: data.phone_number || '',
        email: data.email || '',
        ssmNumber: data.ssm_number || undefined,
      };
      await barbershopOnboardingService.saveProgress('businessInfo', progress.businessInfo);
    }

    // Location
    if (data.address_line1 || data.city) {
      progress.location = {
        addressLine1: data.address_line1 || '',
        addressLine2: data.address_line2 || undefined,
        city: data.city || '',
        state: data.state || '',
        postalCode: data.postal_code || '',
        latitude: 0, // Will be recalculated if needed
        longitude: 0,
      };
      await barbershopOnboardingService.saveProgress('location', progress.location);
    }

    // Documents
    const docs = data.verification_documents as any;
    if (docs || data.logo_url || data.cover_images) {
      progress.documents = {
        logoUrl: data.logo_url || undefined,
        coverImageUrls: data.cover_images || [],
        ssmDocUrl: docs?.ssm_document || undefined,
        businessLicenseUrl: docs?.business_license || undefined,
      };
      await barbershopOnboardingService.saveProgress('documents', progress.documents);
    }

    // Operating Hours
    if (data.opening_hours) {
      progress.operatingHours = data.opening_hours;
      await barbershopOnboardingService.saveProgress('operatingHours', progress.operatingHours);
    }

    // Amenities
    if (data.amenities) {
      progress.amenities = data.amenities;
      await barbershopOnboardingService.saveProgress('amenities', progress.amenities);
    }

    // Payout
    if (data.bank_name || data.bank_account_number) {
      progress.payout = {
        bankName: data.bank_name || '',
        accountNumber: data.bank_account_number || '',
        accountName: data.bank_account_name || '',
      };
      await barbershopOnboardingService.saveProgress('payout', progress.payout);
    }

    console.log('✅ Loaded barbershop progress from database');
  } catch (error) {
    console.error('Error loading barbershop progress from DB:', error);
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Upload image to Supabase Storage
 * Automatically converts all images to JPG format before upload
 */
export async function uploadOnboardingImage(
  uri: string,
  bucket: string,
  folder: string,
  filename: string
): Promise<string | null> {
  try {
    console.log('📤 Uploading image:', { uri, bucket, folder, filename });
    
    // Validate URI
    if (!uri || typeof uri !== 'string') {
      console.error('❌ Invalid URI:', uri);
      return null;
    }
    
    // Convert to JPG if it's a local file (not already uploaded URL)
    let finalUri = uri;
    if (!uri.startsWith('http')) {
      console.log('🔄 Converting to JPG...');
      finalUri = await convertToJpg(uri, 0.8, 1920);
    }
    
    const result = await uploadFile({
      fileUri: finalUri,
      bucket: bucket as any,
      folder: folder,
      fileName: filename,
    });
    
    if (!result.success) {
      console.error('❌ Upload failed:', result.error);
      return null;
    }
    
    console.log('✅ Upload successful:', result.url);
    return result.url || null;
  } catch (error) {
    console.error('Error uploading onboarding image:', error);
    return null;
  }
}

/**
 * Check if onboarding is complete
 */
export async function isOnboardingComplete(userId: string, accountType: 'barber' | 'barbershop'): Promise<boolean> {
  try {
    if (accountType === 'barber') {
      const { data, error } = await supabase
        .from('barbers')
        .select('verification_status')
        .eq('user_id', userId)
        .single();

      if (error || !data) return false;
      return data.verification_status !== 'unverified';
    } else {
      const { data, error } = await supabase
        .from('barbershops')
        .select('verification_status')
        .eq('owner_id', userId)
        .single();

      if (error || !data) return false;
      return data.verification_status !== 'unverified';
    }
  } catch (error) {
    console.error('Error checking onboarding completion:', error);
    return false;
  }
}
