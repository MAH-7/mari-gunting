import * as Sentry from '@sentry/react-native';
import { ENV, isProduction, isDevelopment } from './env';

/**
 * Sentry Configuration
 * 
 * Initialize and configure Sentry for error tracking and performance monitoring
 */

/**
 * Initialize Sentry
 * Call this in your app entry point (App.tsx)
 */
export function initSentry() {
  // Only initialize if DSN is configured and feature is enabled
  if (!ENV.SENTRY_DSN || !ENV.ENABLE_ERROR_TRACKING) {
    if (isDevelopment) {
      console.log('🐛 Sentry not initialized (disabled or not configured)');
    }
    return;
  }

  Sentry.init({
    dsn: ENV.SENTRY_DSN,
    
    // Enable in production and staging, optional in development
    enabled: isProduction || ENV.APP_ENV === 'staging',
    
    // Environment
    environment: ENV.APP_ENV,
    
    // Performance Monitoring
    tracesSampleRate: isProduction ? 0.2 : 1.0, // Sample 20% in prod, 100% in dev
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000, // 30 seconds
    
    // Auto-instrumentation
    enableAutoPerformanceTracing: true,
    enableOutOfMemoryTracking: true,
    
    // Attach stack traces
    attachStacktrace: true,
    
    // Breadcrumbs
    maxBreadcrumbs: 50,
    
    // Before send hook - modify or filter events
    beforeSend(event, hint) {
      // Don't send events in development
      if (isDevelopment && !ENV.ENABLE_ERROR_TRACKING) {
        return null;
      }

      // Filter out sensitive data
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      // Add custom context
      if (event.user) {
        // Don't send email or sensitive user data
        delete event.user.email;
        delete event.user.ip_address;
      }

      return event;
    },
    
    // Integration configuration
    integrations: [
      new Sentry.ReactNativeTracing({
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/.*\.supabase\.co/,
          /^https:\/\/api\.cloudinary\.com/,
          /^https:\/\/api\.mapbox\.com/,
        ],
      }),
    ],
  });

  if (isDevelopment) {
    console.log('🐛 Sentry initialized successfully');
  }
}

/**
 * Set user context
 */
export function setSentryUser(user: {
  id: string;
  username?: string;
  role?: string;
}) {
  Sentry.setUser({
    id: user.id,
    username: user.username,
    role: user.role,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Set custom context
 */
export function setSentryContext(key: string, value: any) {
  Sentry.setContext(key, value);
}

/**
 * Add breadcrumb
 */
export function addSentryBreadcrumb(
  message: string,
  category: string = 'default',
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture exception
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
) {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture message
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string = 'task'
): Sentry.Transaction {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Wrap async function with error tracking
 */
export function wrapAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T {
  return (async (...args: Parameters<T>) => {
    const transaction = startTransaction(name, 'function');
    
    try {
      const result = await fn(...args);
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      captureException(error as Error, {
        tags: { function: name },
      });
      throw error;
    } finally {
      transaction.finish();
    }
  }) as T;
}

/**
 * Profile a sync function
 */
export function profile<T>(
  name: string,
  fn: () => T
): T {
  const transaction = startTransaction(name, 'function');
  
  try {
    const result = fn();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    captureException(error as Error, {
      tags: { function: name },
    });
    throw error;
  } finally {
    transaction.finish();
  }
}

/**
 * Export Sentry instance for direct access
 */
export { Sentry };

/**
 * Common error categories for tagging
 */
export const ErrorCategories = {
  AUTH: 'authentication',
  DATABASE: 'database',
  NETWORK: 'network',
  VALIDATION: 'validation',
  UPLOAD: 'upload',
  LOCATION: 'location',
  PAYMENT: 'payment',
  NAVIGATION: 'navigation',
  UI: 'ui',
} as const;

/**
 * Helper to capture API errors
 */
export function captureAPIError(
  error: Error,
  endpoint: string,
  method: string = 'GET'
) {
  captureException(error, {
    tags: {
      category: ErrorCategories.NETWORK,
      endpoint,
      method,
    },
    extra: {
      message: error.message,
    },
  });
}

/**
 * Helper to capture database errors
 */
export function captureDatabaseError(
  error: Error,
  operation: string,
  table?: string
) {
  captureException(error, {
    tags: {
      category: ErrorCategories.DATABASE,
      operation,
      ...(table && { table }),
    },
  });
}

/**
 * Helper to capture auth errors
 */
export function captureAuthError(
  error: Error,
  operation: 'login' | 'signup' | 'logout' | 'refresh'
) {
  captureException(error, {
    tags: {
      category: ErrorCategories.AUTH,
      operation,
    },
  });
}
