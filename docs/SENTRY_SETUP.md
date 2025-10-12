# Sentry Error Tracking Setup Guide

Complete guide for setting up Sentry error tracking and performance monitoring for Mari-Gunting.

## Table of Contents
- [Account Setup](#account-setup)
- [Environment Configuration](#environment-configuration)
- [Integration](#integration)
- [Usage Examples](#usage-examples)
- [Error Boundary](#error-boundary)
- [Performance Monitoring](#performance-monitoring)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Account Setup

### 1. Create Sentry Account

1. Go to [Sentry.io](https://sentry.io/)
2. Click **Sign Up** (Free tier includes 5,000 errors/month)
3. Verify your email
4. Create an organization

### 2. Create Projects

Create two projects (one for each app):

#### Customer App Project

1. Click **Create Project**
2. Platform: **React Native**
3. Project Name: `mari-gunting-customer`
4. Alert frequency: **On every new issue**

#### Partner App Project

1. Click **Create Project**
2. Platform: **React Native**
3. Project Name: `mari-gunting-partner`
4. Alert frequency: **On every new issue**

### 3. Get Credentials

For each project:

1. Go to **Settings → Projects → [Project Name]**
2. Copy the **DSN** (looks like `https://abc123@o123.ingest.sentry.io/456`)
3. Go to **Settings → Auth Tokens**
4. Create a new token with **project:write** scope

### 4. Add to Environment

```bash
# Sentry Configuration
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-organization-name
SENTRY_PROJECT=mari-gunting-customer # or mari-gunting-partner
SENTRY_AUTH_TOKEN=your-auth-token
```

---

## Environment Configuration

Complete `.env` setup:

```bash
# Sentry Configuration
EXPO_PUBLIC_SENTRY_DSN=https://abc123@o123.ingest.sentry.io/456
SENTRY_ORG=my-org
SENTRY_PROJECT=mari-gunting-customer
SENTRY_AUTH_TOKEN=sntrys_abc123def456

# Enable error tracking
EXPO_PUBLIC_ENABLE_ERROR_TRACKING=true
```

**Note:** Different DSN for customer vs partner app!

---

## Integration

### 1. Initialize Sentry in App Entry Point

Add to your main app file (`App.tsx` or `_layout.tsx`):

```typescript
import { initSentry } from '@shared';

// Initialize Sentry at the very top, before any other code
initSentry();

export default function App() {
  // Your app code
}
```

### 2. Wrap App with Error Boundary

```typescript
import { ErrorBoundary } from '@shared';
import { initSentry } from '@shared';

initSentry();

export default function App() {
  return (
    <ErrorBoundary>
      {/* Your app navigation */}
    </ErrorBoundary>
  );
}
```

### 3. Set User Context on Login

```typescript
import { setSentryUser, clearSentryUser } from '@shared';

// On login
function handleLogin(user) {
  setSentryUser({
    id: user.id,
    username: user.email?.split('@')[0],
    role: user.role
  });
}

// On logout
function handleLogout() {
  clearSentryUser();
}
```

---

## Usage Examples

### Example 1: Capture Exception

```typescript
import { captureException, ErrorCategories } from '@shared';

async function fetchData() {
  try {
    const response = await api.getData();
    return response;
  } catch (error) {
    captureException(error as Error, {
      tags: {
        category: ErrorCategories.NETWORK,
        endpoint: '/api/data'
      },
      extra: {
        userId: currentUser.id,
        timestamp: new Date().toISOString()
      },
      level: 'error'
    });
    throw error;
  }
}
```

### Example 2: Capture Message

```typescript
import { captureMessage } from '@shared';

function handlePayment(amount: number) {
  if (amount > 10000) {
    captureMessage(
      `Large payment attempt: RM${amount}`,
      'warning',
      {
        tags: { category: 'payment' },
        extra: { amount, currency: 'MYR' }
      }
    );
  }
  // Process payment
}
```

### Example 3: Add Breadcrumbs

```typescript
import { addSentryBreadcrumb } from '@shared';

function BookingFlow() {
  const handleSelectBarber = (barberId: string) => {
    addSentryBreadcrumb(
      'Barber selected',
      'navigation',
      'info',
      { barberId }
    );
    // Navigate to booking
  };

  const handleConfirmBooking = () => {
    addSentryBreadcrumb(
      'Booking confirmed',
      'user.action',
      'info',
      { timestamp: new Date().toISOString() }
    );
    // Submit booking
  };
}
```

### Example 4: API Error Tracking

```typescript
import { captureAPIError } from '@shared';

async function callAPI(endpoint: string) {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    captureAPIError(error as Error, endpoint, 'GET');
    throw error;
  }
}
```

### Example 5: Database Error Tracking

```typescript
import { captureDatabaseError } from '@shared';
import { supabase } from '@shared';

async function createBooking(data: BookingData) {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(data)
      .single();

    if (error) throw error;
    return booking;
  } catch (error) {
    captureDatabaseError(
      error as Error,
      'insert',
      'bookings'
    );
    throw error;
  }
}
```

### Example 6: Auth Error Tracking

```typescript
import { captureAuthError } from '@shared';
import { authService } from '@shared';

async function login(email: string, password: string) {
  try {
    const result = await authService.signInWithEmail(email, password);
    return result;
  } catch (error) {
    captureAuthError(error as Error, 'login');
    throw error;
  }
}
```

### Example 7: Wrap Async Functions

```typescript
import { wrapAsync } from '@shared';

const fetchBarbershops = wrapAsync(
  async (location: Coordinates) => {
    const { data } = await supabase
      .from('barbershops')
      .select('*')
      .limit(20);
    return data;
  },
  'fetchBarbershops'
);

// Automatically tracks errors and performance
const barbershops = await fetchBarbershops(userLocation);
```

---

## Error Boundary

### Basic Usage

```typescript
import { ErrorBoundary } from '@shared';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

### Custom Fallback UI

```typescript
import { ErrorBoundary } from '@shared';

function App() {
  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <View>
          <Text>Custom Error Screen</Text>
          <Text>{error.message}</Text>
          <Button title="Retry" onPress={resetError} />
        </View>
      )}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

### Wrap Specific Components

```typescript
import { ErrorBoundary } from '@shared';

function BookingScreen() {
  return (
    <View>
      <Header />
      
      <ErrorBoundary>
        <BookingForm />
      </ErrorBoundary>
      
      <Footer />
    </View>
  );
}
```

### Using HOC

```typescript
import { withErrorBoundary } from '@shared';

const BookingScreen = withErrorBoundary(
  ({ navigation }) => {
    // Your component
  }
);

export default BookingScreen;
```

---

## Performance Monitoring

### Track Transactions

```typescript
import { startTransaction } from '@shared';

async function loadDashboard() {
  const transaction = startTransaction('load-dashboard', 'screen');
  
  try {
    // Load data
    const barbershops = await fetchBarbershops();
    const bookings = await fetchBookings();
    
    transaction.setStatus('ok');
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
}
```

### Profile Functions

```typescript
import { profile } from '@shared';

function processLargeData(data: any[]) {
  return profile('processLargeData', () => {
    // CPU-intensive operation
    return data.map(item => transform(item));
  });
}
```

### Custom Spans

```typescript
import { startTransaction } from '@shared';

async function complexOperation() {
  const transaction = startTransaction('complex-operation', 'task');
  
  const span1 = transaction.startChild({ op: 'database.query' });
  await fetchData();
  span1.finish();
  
  const span2 = transaction.startChild({ op: 'image.upload' });
  await uploadImage();
  span2.finish();
  
  transaction.finish();
}
```

---

## Best Practices

### 1. Set User Context

Always set user context after login:

```typescript
import { setSentryUser } from '@shared';

authService.onAuthStateChange((user) => {
  if (user) {
    setSentryUser({
      id: user.id,
      username: user.email?.split('@')[0],
      role: user.role
    });
  } else {
    clearSentryUser();
  }
});
```

### 2. Use Error Categories

Tag errors with categories for better organization:

```typescript
import { ErrorCategories } from '@shared';

captureException(error, {
  tags: {
    category: ErrorCategories.PAYMENT,
    provider: 'stripe'
  }
});
```

### 3. Add Contextual Data

Include relevant context with errors:

```typescript
captureException(error, {
  extra: {
    bookingId: booking.id,
    userId: user.id,
    timestamp: new Date().toISOString(),
    deviceInfo: Platform.OS
  }
});
```

### 4. Don't Over-Log

Avoid capturing non-errors:

```typescript
// ❌ BAD - Logging expected behaviors
if (!user) {
  captureMessage('User not found'); // Don't do this
}

// ✅ GOOD - Only log actual issues
if (unexpectedError) {
  captureException(unexpectedError);
}
```

### 5. Use Breadcrumbs

Add breadcrumbs to trace user journey:

```typescript
// Navigation
addSentryBreadcrumb('Navigated to Booking Screen', 'navigation');

// User actions
addSentryBreadcrumb('Selected barber', 'user.action', 'info', { barberId });

// API calls
addSentryBreadcrumb('Fetching bookings', 'http', 'info', { endpoint });
```

### 6. Sensitive Data

Never send sensitive data to Sentry:

```typescript
// ❌ BAD
captureException(error, {
  extra: {
    password: user.password, // Never!
    creditCard: payment.cc  // Never!
  }
});

// ✅ GOOD
captureException(error, {
  extra: {
    userId: user.id,
    paymentMethod: 'card' // Safe
  }
});
```

### 7. Environment-Specific

Use different sample rates per environment:

```typescript
// In sentry.ts config
tracesSampleRate: isProduction ? 0.2 : 1.0
```

---

## Troubleshooting

### Sentry Not Initializing

**Issue:** No errors showing in Sentry dashboard

**Solutions:**
1. Check DSN is correct:
   ```bash
   echo $EXPO_PUBLIC_SENTRY_DSN
   ```

2. Enable error tracking:
   ```bash
   EXPO_PUBLIC_ENABLE_ERROR_TRACKING=true
   ```

3. Check initialization:
   ```typescript
   // Should see log in development
   initSentry(); // Logs: "🐛 Sentry initialized successfully"
   ```

### Source Maps Not Uploading

**Issue:** Stack traces show minified code

**Solutions:**
1. Verify auth token has **project:write** scope
2. Check `SENTRY_AUTH_TOKEN` in `.env`
3. Rebuild with source maps:
   ```bash
   npx expo build:ios --release-channel production
   ```

### Errors Not Captured in Production

**Cause:** Development-only configuration

**Solution:**
```typescript
// Check environment
if (ENV.APP_ENV === 'production') {
  // Sentry should be enabled
  console.log('Sentry enabled:', ENV.ENABLE_ERROR_TRACKING);
}
```

### Too Many Events

**Issue:** Quota exhausted quickly

**Solutions:**
1. Reduce sample rate:
   ```typescript
   tracesSampleRate: 0.1 // 10%
   ```

2. Filter events:
   ```typescript
   beforeSend(event) {
     // Filter out non-critical errors
     if (event.exception?.values?.[0]?.type === 'NetworkError') {
       return null;
     }
     return event;
   }
   ```

3. Set up inbound filters in Sentry dashboard

### Performance Impact

**Issue:** App feels slower with Sentry

**Solutions:**
1. Disable in development:
   ```bash
   EXPO_PUBLIC_ENABLE_ERROR_TRACKING=false
   ```

2. Reduce sample rate:
   ```typescript
   tracesSampleRate: 0.1
   ```

3. Disable auto-instrumentation:
   ```typescript
   enableAutoPerformanceTracing: false
   ```

---

## Sentry Dashboard

### View Errors

1. Go to **Issues**
2. Click on an error to see:
   - Stack trace
   - Breadcrumbs
   - User context
   - Device info
   - Release version

### Performance

1. Go to **Performance**
2. View:
   - Transaction summaries
   - Slow operations
   - Error rates
   - Throughput

### Alerts

Set up alerts for:
- New errors
- Error spikes
- Performance degradation
- Specific error types

### Releases

Track errors per release:
1. Go to **Releases**
2. See error rates per version
3. Compare releases

---

## API Limits

### Free Tier

- **Errors:** 5,000/month
- **Performance Events:** 10,000/month
- **Attachments:** 1GB/month
- **Data Retention:** 30 days

### Monitoring Usage

1. Go to **Settings → Usage**
2. Monitor:
   - Error quota
   - Performance quota
   - Attachment storage
3. Set up quota alerts

---

## Additional Resources

- [Sentry React Native Documentation](https://docs.sentry.io/platforms/react-native/)
- [Error Monitoring Best Practices](https://docs.sentry.io/product/best-practices/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Source Maps Guide](https://docs.sentry.io/platforms/react-native/sourcemaps/)

---

**Need Help?** Check the troubleshooting section or contact Sentry support.
