/**
 * Animation Constants
 * 
 * Centralized animation values to ensure consistency across the entire app.
 * Following Grab's production standards for smooth 60fps animations.
 * 
 * @author Mari Gunting Dev Team
 * @production-ready
 */

/**
 * TIMING CONSTANTS
 * All durations in milliseconds
 */
export const ANIMATION_DURATION = {
  // Fast - For micro-interactions (button presses, small state changes)
  FAST: 150,
  
  // Normal - Default for most UI transitions
  NORMAL: 200,
  
  // Medium - For screen transitions, modal animations
  MEDIUM: 300,
  
  // Slow - For attention-grabbing animations
  SLOW: 400,
} as const;

/**
 * SPRING ANIMATION CONFIG
 * For natural, physics-based animations
 */
export const SPRING_CONFIG = {
  // Default spring - smooth and natural
  DEFAULT: {
    damping: 25,
    stiffness: 120,
  },
  
  // Bouncy - More playful feel
  BOUNCY: {
    damping: 20,
    stiffness: 150,
  },
  
  // Stiff - Quick and responsive
  STIFF: {
    damping: 30,
    stiffness: 200,
  },
  
  // Gentle - Smooth and calm
  GENTLE: {
    damping: 30,
    stiffness: 100,
  },
} as const;

/**
 * EASING CURVES
 * Standard easing functions for consistent motion
 */
export const EASING = {
  // Standard ease for most transitions
  STANDARD: 'ease-in-out',
  
  // Ease out for entering elements
  OUT: 'ease-out',
  
  // Ease in for exiting elements
  IN: 'ease-in',
  
  // Linear for progress indicators
  LINEAR: 'linear',
} as const;

/**
 * OPACITY VALUES
 * Standardized opacity for interactive elements
 */
export const ACTIVE_OPACITY = {
  // Primary buttons and important CTAs
  PRIMARY: 0.8,
  
  // Secondary buttons and cards
  SECONDARY: 0.9,
  
  // Tertiary/subtle interactions
  TERTIARY: 0.95,
  
  // Disabled state
  DISABLED: 0.5,
  
  // Backdrop overlays
  BACKDROP: 0.5,
} as const;

/**
 * MODAL ANIMATION CONFIG
 * Standardized configuration for all bottom sheet modals
 */
export const MODAL_ANIMATION = {
  // Backdrop fade-in duration
  BACKDROP_FADE_IN: ANIMATION_DURATION.NORMAL,
  
  // Backdrop fade-out duration (slightly faster)
  BACKDROP_FADE_OUT: ANIMATION_DURATION.FAST,
  
  // Modal slide-up duration (using spring)
  SLIDE_DURATION: ANIMATION_DURATION.NORMAL,
  
  // Spring configuration for modal slide
  SPRING: SPRING_CONFIG.DEFAULT,
  
  // Backdrop opacity
  BACKDROP_OPACITY: ACTIVE_OPACITY.BACKDROP,
} as const;

/**
 * SCREEN TRANSITION CONFIG
 * For navigation between screens
 */
export const SCREEN_TRANSITION = {
  DURATION: ANIMATION_DURATION.MEDIUM,
  EASING: EASING.STANDARD,
} as const;

/**
 * MICRO-INTERACTION CONFIG
 * For buttons, toggles, and small UI elements
 */
export const MICRO_INTERACTION = {
  DURATION: ANIMATION_DURATION.FAST,
  SCALE: {
    PRESSED: 0.98,
    NORMAL: 1,
  },
} as const;

/**
 * HELPER FUNCTIONS
 */

/**
 * Creates a standardized timing config for Animated.timing
 */
export const createTimingConfig = (
  duration: number = ANIMATION_DURATION.NORMAL,
  useNativeDriver: boolean = true
) => ({
  duration,
  useNativeDriver,
});

/**
 * Creates a standardized spring config for Animated.spring
 */
export const createSpringConfig = (
  config: typeof SPRING_CONFIG.DEFAULT = SPRING_CONFIG.DEFAULT,
  useNativeDriver: boolean = true
) => ({
  ...config,
  useNativeDriver,
});

/**
 * Creates a parallel animation group for modals (backdrop + slide)
 */
export const createModalEnterAnimation = (
  fadeAnim: any,
  slideAnim: any
) => ({
  fadeIn: createTimingConfig(MODAL_ANIMATION.BACKDROP_FADE_IN),
  slideUp: createSpringConfig(MODAL_ANIMATION.SPRING),
});

/**
 * Creates a parallel animation group for modal exit
 */
export const createModalExitAnimation = (
  fadeAnim: any,
  slideAnim: any
) => ({
  fadeOut: createTimingConfig(MODAL_ANIMATION.BACKDROP_FADE_OUT),
  slideDown: createTimingConfig(MODAL_ANIMATION.SLIDE_DURATION),
});
