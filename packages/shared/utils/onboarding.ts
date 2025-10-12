/**
 * Onboarding Navigation & Step Management
 * Handles routing logic and step progression
 */

import { OnboardingStatus, OnboardingProgress, AccountType, OnboardingStep } from '@/types/onboarding';

/**
 * Define all onboarding steps
 */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  // Note: account_type step removed - now selected during registration
  {
    id: 'ekyc',
    route: '/onboarding/ekyc',
    title: 'Identity Verification',
    description: 'Verify your identity',
    isRequired: true,
    accountTypes: ['freelance', 'barbershop'],
    order: 1,
  },
  {
    id: 'business',
    route: '/onboarding/business',
    title: 'Business Details',
    description: 'Register your business',
    isRequired: true,
    accountTypes: ['barbershop'],
    order: 2,
  },
  {
    id: 'payout',
    route: '/onboarding/payout',
    title: 'Payout Setup',
    description: 'Add your bank account',
    isRequired: true,
    accountTypes: ['freelance', 'barbershop'],
    order: 3,
  },
  {
    id: 'services',
    route: '/onboarding/services',
    title: 'Services & Pricing',
    description: 'Configure your services',
    isRequired: true,
    accountTypes: ['freelance', 'barbershop'],
    order: 4,
  },
  {
    id: 'availability',
    route: '/onboarding/availability',
    title: 'Availability',
    description: 'Set your working hours',
    isRequired: true,
    accountTypes: ['freelance', 'barbershop'],
    order: 5,
  },
  {
    id: 'portfolio',
    route: '/onboarding/portfolio',
    title: 'Portfolio',
    description: 'Showcase your work',
    isRequired: true,
    accountTypes: ['freelance', 'barbershop'],
    order: 6,
  },
  {
    id: 'review',
    route: '/onboarding/review',
    title: 'Review & Submit',
    description: 'Review and submit',
    isRequired: true,
    accountTypes: ['freelance', 'barbershop'],
    order: 7,
  },
];

/**
 * Get filtered steps based on account type
 */
export function getStepsForAccountType(accountType?: AccountType): OnboardingStep[] {
  if (!accountType) return [];
  
  return ONBOARDING_STEPS
    .filter(step => step.accountTypes.includes(accountType))
    .sort((a, b) => a.order - b.order);
}

/**
 * Determine the next route based on onboarding progress
 */
export function getNextOnboardingRoute(progress?: OnboardingProgress): string {
  if (!progress) {
    return '/onboarding/welcome';
  }

  const { status, accountType } = progress;

  // Not started, phone verified, or account type selected - go to eKYC
  // Note: Account type is now selected during registration, not as a separate onboarding step
  if (status === 'not_started' || status === 'phone_verified' || status === 'account_type_selected') {
    return '/onboarding/ekyc';
  }

  // eKYC flow - skip pending screens, go straight to next step
  if (status === 'ekyc_submitted' || status === 'ekyc_passed') {
    // Barbershop needs business details
    if (accountType === 'barbershop') {
      return '/onboarding/business';
    }
    // Freelance goes straight to payout
    return '/onboarding/payout';
  }

  // Business verification (barbershop only) - skip pending screen
  if (status === 'business_submitted' || status === 'business_verified') {
    return '/onboarding/payout';
  }

  // Payout - skip pending screen
  if (status === 'payout_submitted' || status === 'payout_verified') {
    return '/onboarding/services';
  }

  // Services
  if (status === 'services_completed') {
    return '/onboarding/availability';
  }

  // Availability
  if (status === 'availability_completed') {
    return '/onboarding/portfolio';
  }

  // Portfolio
  if (status === 'portfolio_completed') {
    return '/onboarding/review';
  }

  // Review states
  if (status === 'pending_review') {
    return '/onboarding/pending-review';
  }

  if (status === 'needs_more_info') {
    return '/onboarding/fix-issues';
  }

  if (status === 'rejected') {
    return '/onboarding/rejected';
  }

  // Approved - go to dashboard
  if (status === 'approved') {
    return '/(tabs)/dashboard';
  }

  // Default fallback
  return '/onboarding/welcome';
}

/**
 * Calculate completion percentage
 */
export function calculateCompletionPercentage(progress: OnboardingProgress): number {
  if (!progress || progress.totalSteps === 0) return 0;
  return Math.round((progress.currentStep / progress.totalSteps) * 100);
}

/**
 * Check if user can access a specific step
 */
export function canAccessStep(
  stepId: string,
  progress: OnboardingProgress
): boolean {
  const step = ONBOARDING_STEPS.find(s => s.id === stepId);
  if (!step) return false;

  // Check if account type matches
  if (progress.accountType && !step.accountTypes.includes(progress.accountType)) {
    return false;
  }

  // Check if previous steps are completed
  const requiredSteps = ONBOARDING_STEPS
    .filter(s => s.order < step.order && s.isRequired)
    .filter(s => !progress.accountType || s.accountTypes.includes(progress.accountType));

  return requiredSteps.every(s => progress.completedSteps.includes(s.id));
}

/**
 * Get current step info
 */
export function getCurrentStepInfo(progress: OnboardingProgress): OnboardingStep | null {
  const route = getNextOnboardingRoute(progress);
  return ONBOARDING_STEPS.find(s => s.route === route) || null;
}

/**
 * Check if onboarding is complete
 */
export function isOnboardingComplete(progress: OnboardingProgress): boolean {
  return progress.status === 'approved';
}

/**
 * Check if onboarding is in review/pending state
 */
export function isOnboardingPending(progress: OnboardingProgress): boolean {
  return ['pending_review', 'ekyc_submitted', 'business_submitted', 'payout_submitted'].includes(
    progress.status
  );
}

/**
 * Get step title by route
 */
export function getStepTitle(route: string): string {
  const step = ONBOARDING_STEPS.find(s => s.route === route);
  return step?.title || 'Onboarding';
}

/**
 * Validate if all required data is present for submission
 */
export function canSubmitForReview(progress: OnboardingProgress): boolean {
  const requiredSteps = getStepsForAccountType(progress.accountType)
    .filter(s => s.isRequired)
    .map(s => s.id);

  return requiredSteps.every(stepId => progress.completedSteps.includes(stepId));
}

/**
 * Get readable status text
 */
export function getStatusText(status: OnboardingStatus): string {
  const statusMap: Record<OnboardingStatus, string> = {
    not_started: 'Not Started',
    phone_verified: 'Phone Verified',
    account_type_selected: 'Account Type Selected',
    ekyc_submitted: 'Identity Verification Pending',
    ekyc_passed: 'Identity Verified',
    business_submitted: 'Business Verification Pending',
    business_verified: 'Business Verified',
    payout_submitted: 'Bank Verification Pending',
    payout_verified: 'Bank Account Verified',
    services_completed: 'Services Configured',
    availability_completed: 'Availability Set',
    portfolio_completed: 'Portfolio Added',
    pending_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    needs_more_info: 'Additional Info Required',
  };

  return statusMap[status] || status;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: OnboardingStatus): string {
  if (['approved', 'ekyc_passed', 'business_verified', 'payout_verified'].includes(status)) {
    return '#00B14F'; // Success green
  }
  
  if (['pending_review', 'ekyc_submitted', 'business_submitted', 'payout_submitted'].includes(status)) {
    return '#FF9800'; // Warning orange
  }
  
  if (status === 'rejected') {
    return '#DC2626'; // Error red
  }
  
  if (status === 'needs_more_info') {
    return '#F59E0B'; // Amber
  }
  
  return '#6B7280'; // Gray for in-progress
}
