// Shared typography constants for Mari Gunting
// Used by both Customer and Partner apps

export const TYPOGRAPHY = {
  heading: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 32,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
  },
  
  body: {
    large: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    regular: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
  },
  
  label: {
    large: {
      fontSize: 16,
      fontWeight: '600' as const,
    },
    regular: {
      fontSize: 14,
      fontWeight: '600' as const,
    },
    small: {
      fontSize: 12,
      fontWeight: '600' as const,
    },
  },
  
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
} as const;

// Spacing constants
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Border radius constants
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;
