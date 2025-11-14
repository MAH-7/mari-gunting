/**
 * Mari-Gunting Design System
 *
 * ⚡ SINGLE SOURCE OF TRUTH FOR ALL COLORS
 * Change colors here and the entire app updates automatically!
 *
 * Used by both Customer and Partner apps.
 */

export const Colors = {
  // Primary Brand Colors (Orange)
  primary: "#F97316",
  primaryDark: "#EA580C",
  primaryLight: "#FED7AA",
  primaryBorder: "#FDBA74", // Medium orange for borders
  primaryText: "#9A3412", // Dark orange for text on light backgrounds

  // Secondary Colors
  secondary: "#1E293B",
  secondaryLight: "#334155",
  secondaryDark: "#0F172A",

  // Neutral colors
  black: "#000000",
  white: "#FFFFFF",
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },

  // Semantic/Status colors
  success: "#10B981",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  info: "#3B82F6",
  infoLight: "#DBEAFE",

  // Background
  background: "#FFFFFF",
  backgroundSecondary: "#F9FAFB",
  backgroundTertiary: "#F3F4F6",

  // Text
  text: {
    primary: "#111827",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    inverse: "#FFFFFF",
    disabled: "#D1D5DB",
  },

  // Border
  border: {
    light: "#E5E7EB",
    medium: "#D1D5DB",
    dark: "#9CA3AF",
  },

  // Rating
  rating: {
    filled: "#FCD34D",
    empty: "#D1D5DB",
  },

  // Booking Status Colors
  status: {
    pending: "#F59E0B",      // Amber - waiting
    accepted: "#3B82F6",     // Blue - confirmed
    confirmed: "#3B82F6",    // Blue - confirmed
    ready: "#10B981",        // Green - ready to go
    onTheWay: "#6366F1",     // Indigo - in transit
    arrived: "#8B5CF6",      // Purple - arrived
    inProgress: "#EC4899",   // Pink - active work
    completed: "#10B981",    // Green - done
    cancelled: "#EF4444",    // Red - cancelled
    rejected: "#EF4444",     // Red - rejected
    expired: "#6B7280",      // Gray - expired
  },

  // Overlay
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayLight: "rgba(0, 0, 0, 0.3)",
} as const;

export const Typography = {
  fontFamily: {
    regular: "System",
    medium: "System",
    semibold: "System",
    bold: "System",
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
  "3xl": 48,
  "4xl": 64,
} as const;

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  full: 9999,
} as const;

export const Shadows = {
  none: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const ZIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  toast: 1700,
} as const;

export const Layout = {
  containerPadding: Spacing.md,
  headerHeight: 60,
  tabBarHeight: 60,
  inputHeight: 48,
  buttonHeight: 48,
} as const;

// Helper function to get responsive spacing
export const getResponsiveSpacing = (base: number, multiplier: number = 1) => {
  return base * multiplier;
};

// Helper function to get text style
export const getTextStyle = (
  size: keyof typeof Typography.fontSize,
  weight: keyof typeof Typography.fontWeight = "normal",
  color: string = Colors.text.primary
) => ({
  fontSize: Typography.fontSize[size],
  fontWeight: Typography.fontWeight[weight],
  color,
  lineHeight: Typography.fontSize[size] * Typography.lineHeight.normal,
});

// Helper function to get status color (with backward compatibility)
export const getStatusColor = (status: string): string => {
  // Normalize status key (handle both 'on-the-way' and 'onTheWay' formats)
  const normalizedStatus = status.replace(/-/g, "");
  const statusKey = Object.keys(Colors.status).find(
    (key) => key.toLowerCase() === normalizedStatus.toLowerCase()
  ) as keyof typeof Colors.status;

  return Colors.status[statusKey] || Colors.text.secondary;
};

// Helper function to get status background color
export const getStatusBackground = (status: string): string => {
  const statusBgColors: Record<string, string> = {
    pending: "#FEF3C7",
    accepted: "#DBEAFE",
    confirmed: "#DBEAFE",
    ready: "#EDE9FE",
    "on-the-way": "#EDE9FE",
    ontheway: "#EDE9FE",
    arrived: "#EDE9FE",
    "in-progress": "#EDE9FE",
    inprogress: "#EDE9FE",
    completed: "#D1FAE5",
    cancelled: "#FEE2E2",
    rejected: "#FEE2E2",
    expired: "#FFF7ED",
  };
  return statusBgColors[status.toLowerCase().replace(/-/g, "")] || "#F3F4F6";
};

// Export theme object
export const theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  breakpoints: Breakpoints,
  zIndex: ZIndex,
  layout: Layout,
} as const;

export type Theme = typeof theme;

// Backward compatibility: Export as COLORS (uppercase) too
export const COLORS = Colors;

export default theme;
