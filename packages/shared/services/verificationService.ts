/**
 * Verification Service
 * Handles partner verification status checking and updates
 */

import { supabase } from '../config/supabase';

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type StepStatus = 'not_started' | 'in_progress' | 'submitted' | 'verified' | 'failed';

export interface VerificationStep {
  id: string;
  label: string;
  status: StepStatus;
  submittedAt?: string | null;
  verifiedAt?: string | null;
  message?: string;
}

export interface VerificationInfo {
  status: VerificationStatus;
  accountType: 'freelance' | 'barbershop' | null;
  isComplete: boolean;
  hasSubmittedOnboarding: boolean; // NEW: Did user submit docs for review?
  message: string;
  canAcceptBookings: boolean;
  estimatedCompletionDate?: string; // NEW: Estimated approval date
  steps: VerificationStep[]; // NEW: Detailed step-by-step status
}

export const verificationService = {
  /**
   * Get partner verification status
   * Checks both barbers and barbershops tables
   */
  async getVerificationStatus(userId: string): Promise<VerificationInfo> {
    try {
      // Check if user is a freelance barber
      const { data: barber, error: barberError } = await supabase
        .from('barbers')
        .select('id, verification_status, is_verified')
        .eq('user_id', userId)
        .maybeSingle();

      if (barber) {
        const status = barber.verification_status as VerificationStatus;
        
        // Check if onboarding was actually submitted (status is pending or verified, not unverified)
        const hasSubmittedOnboarding = status !== 'unverified';
        
        // Get detailed step statuses
        const steps = await this.getVerificationSteps(userId, 'freelance');
        const estimatedDate = this.calculateEstimatedCompletionDate(status);
        
        return {
          status,
          accountType: 'freelance',
          isComplete: true,
          hasSubmittedOnboarding,
          message: this.getStatusMessage(status),
          canAcceptBookings: status === 'verified' && barber.is_verified,
          steps,
          estimatedCompletionDate: estimatedDate,
        };
      }

      // Check if user is a barbershop owner
      const { data: barbershop, error: shopError } = await supabase
        .from('barbershops')
        .select('id, verification_status')
        .eq('owner_id', userId)
        .maybeSingle();

      if (barbershop) {
        const status = barbershop.verification_status as VerificationStatus;
        
        // Check if onboarding was actually submitted
        const hasSubmittedOnboarding = status !== 'unverified';
        
        // Get detailed step statuses
        const steps = await this.getVerificationSteps(userId, 'barbershop');
        const estimatedDate = this.calculateEstimatedCompletionDate(status);
        
        return {
          status,
          accountType: 'barbershop',
          isComplete: true,
          hasSubmittedOnboarding,
          message: this.getStatusMessage(status),
          canAcceptBookings: status === 'verified',
          steps,
          estimatedCompletionDate: estimatedDate,
        };
      }

      // User has profile but hasn't completed account type selection
      return {
        status: 'unverified',
        accountType: null,
        isComplete: false,
        hasSubmittedOnboarding: false,
        message: 'Please complete your account setup',
        canAcceptBookings: false,
        steps: [],
      };
    } catch (error: any) {
      console.error('❌ Verification status check error:', error);
      return {
        status: 'unverified',
        accountType: null,
        isComplete: false,
        hasSubmittedOnboarding: false,
        message: 'Unable to check verification status',
        canAcceptBookings: false,
        steps: [],
      };
    }
  },

  /**
   * Get detailed verification steps status
   */
  async getVerificationSteps(
    userId: string,
    accountType: 'freelance' | 'barbershop'
  ): Promise<VerificationStep[]> {
    try {
      // For demo: Return mock data until we have actual verification tracking tables
      // In production, this would query verification_documents or similar tables
      
      const baseSteps: VerificationStep[] = [
        {
          id: 'ekyc',
          label: 'Identity Verification',
          status: 'submitted',
          submittedAt: new Date().toISOString(),
          message: 'Documents received and under review',
        },
      ];

      if (accountType === 'barbershop') {
        baseSteps.push({
          id: 'business',
          label: 'Business Registration',
          status: 'submitted',
          submittedAt: new Date().toISOString(),
          message: 'SSM documents under verification',
        });
      }

      baseSteps.push({
        id: 'payout',
        label: 'Bank Account',
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        message: 'Test deposit sent',
      });

      baseSteps.push({
        id: 'profile',
        label: 'Profile Completion',
        status: 'verified',
        submittedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        message: 'All required information provided',
      });

      return baseSteps;
    } catch (error) {
      console.error('❌ Error fetching verification steps:', error);
      return [];
    }
  },

  /**
   * Calculate estimated completion date
   */
  calculateEstimatedCompletionDate(status: VerificationStatus): string | undefined {
    if (status !== 'pending') return undefined;

    // Add 2 business days from now
    const now = new Date();
    let businessDaysToAdd = 2;
    let currentDate = new Date(now);

    while (businessDaysToAdd > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDaysToAdd--;
      }
    }

    return currentDate.toISOString();
  },

  /**
   * Get user-friendly status message
   */
  getStatusMessage(status: VerificationStatus): string {
    switch (status) {
      case 'unverified':
        return 'Complete your profile to get verified';
      case 'pending':
        return 'Your documents are under review (1-2 business days)';
      case 'verified':
        return 'Your account is verified! You can accept bookings.';
      case 'rejected':
        return 'Verification failed. Please resubmit your documents.';
      default:
        return 'Unknown status';
    }
  },

  /**
   * Update verification status (for admin use)
   */
  async updateVerificationStatus(
    userId: string,
    status: VerificationStatus,
    accountType: 'freelance' | 'barbershop'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔧 Updating verification status to ${status} for:`, userId);

      if (accountType === 'freelance') {
        const { error } = await supabase
          .from('barbers')
          .update({
            verification_status: status,
            is_verified: status === 'verified',
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('barbershops')
          .update({
            verification_status: status,
          })
          .eq('owner_id', userId);

        if (error) throw error;
      }

      console.log('✅ Verification status updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Update verification status error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update verification status',
      };
    }
  },

  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const status = await this.getVerificationStatus(userId);
    return status.isComplete;
  },
};
