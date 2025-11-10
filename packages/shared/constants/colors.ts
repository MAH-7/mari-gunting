/**
 * ⚠️ DEPRECATED: This file now re-exports from the unified theme.
 * 
 * Please import from '@mari-gunting/shared/theme' instead:
 * 
 * OLD: import { COLORS } from '@mari-gunting/shared/constants'
 * NEW: import { Colors, theme } from '@mari-gunting/shared/theme'
 * 
 * This file will be removed in a future version.
 */

import { 
  Colors as ThemeColors, 
  getStatusColor as themeGetStatusColor,
  getStatusBackground as themeGetStatusBackground 
} from '../theme';

// Re-export for backward compatibility
export const COLORS = {
  ...ThemeColors,
  background: {
    primary: ThemeColors.background,
    secondary: ThemeColors.backgroundSecondary,
    tertiary: ThemeColors.backgroundTertiary,
  },
} as const;

// Re-export helper functions
export const getStatusColor = themeGetStatusColor;
export const getStatusBackground = themeGetStatusBackground;
