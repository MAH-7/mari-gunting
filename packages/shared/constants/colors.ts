// Shared color constants for Mari Gunting
// Used by both Customer and Partner apps

export const COLORS = {
  // Primary Brand Colors
  primary: '#7E3AF2',
  primaryDark: '#6C2BD9',
  primaryLight: '#F5F3FF',
  
  // Secondary
  secondary: '#1E293B',
  secondaryLight: '#334155',
  
  // Status Colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  
  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    disabled: '#D1D5DB',
    inverse: '#FFFFFF',
  },
  
  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
  },
  
  // Border Colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },
  
  // Booking Status Colors
  status: {
    pending: '#F59E0B',
    accepted: '#3B82F6',
    confirmed: '#3B82F6',
    ready: '#8B5CF6',
    'on-the-way': '#8B5CF6',
    arrived: '#8B5CF6',
    'in-progress': '#7E3AF2',
    completed: '#10B981',
    cancelled: '#EF4444',
    rejected: '#EF4444',
    expired: '#F97316',
  },
} as const;

// Helper function to get status color
export const getStatusColor = (status: string): string => {
  return COLORS.status[status as keyof typeof COLORS.status] || COLORS.text.secondary;
};

// Helper function to get status background
export const getStatusBackground = (status: string): string => {
  const statusColors: Record<string, string> = {
    pending: '#FEF3C7',
    accepted: '#DBEAFE',
    confirmed: '#DBEAFE',
    ready: '#EDE9FE',
    'on-the-way': '#EDE9FE',
    arrived: '#EDE9FE',
    'in-progress': '#EDE9FE',
    completed: '#D1FAE5',
    cancelled: '#FEE2E2',
    rejected: '#FEE2E2',
    expired: '#FFF7ED',
  };
  return statusColors[status] || '#F3F4F6';
};
