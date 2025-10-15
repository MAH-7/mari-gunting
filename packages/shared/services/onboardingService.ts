import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { uploadFile } from './storage';

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
  async saveProgress(step: keyof BarberOnboardingData, data: any): Promise<void> {
    try {
      const key = `onboarding_barber_${step}`;
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving barber progress (${step}):`, error);
      throw error;
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
// HELPER FUNCTIONS
// =====================================================

/**
 * Upload image to Supabase Storage
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
    
    const result = await uploadFile({
      fileUri: uri,
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
