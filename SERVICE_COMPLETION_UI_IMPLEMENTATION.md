# Service Completion Confirmation UI Implementation Guide

## Overview
Add a confirmation card with countdown timer and action buttons when booking status is `completed` and payment is not yet confirmed.

## Files Modified
- `apps/customer/app/booking/[id].tsx`

## Code Changes

### 1. Add State Variables (Already Done)
```typescript
const [showDisputeModal, setShowDisputeModal] = useState(false);
const [disputeReason, setDisputeReason] = useState('');
const [timeRemaining, setTimeRemaining] = useState<number>(0);
```

### 2. Add Mutations (Already Done)
```typescript
// Confirm service completion mutation
const confirmServiceMutation = useMutation({ ... });

// Report issue mutation  
const reportIssueMutation = useMutation({ ... });
```

### 3. Add Timer Logic (Add after booking data is loaded)
```typescript
// Calculate time remaining for auto-confirmation
useEffect(() => {
  if (!booking) return;
  
  // Only show timer if booking is completed but not confirmed/disputed
  if (
    booking.status === 'completed' &&
    !booking.completion_confirmed_at &&
    !booking.disputed_at &&
    booking.payment_status === 'authorized'
  ) {
    // Calculate time remaining based on completed_at + 2 hours
    const calculateTimeRemaining = () => {
      if (!booking.completed_at) return 0;
      
      const completedTime = new Date(booking.completed_at).getTime();
      const autoConfirmTime = completedTime + (2 * 60 * 60 * 1000); // +2 hours
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((autoConfirmTime - now) / 1000)); // in seconds
      
      return remaining;
    };
    
    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());
    
    // Update every second
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        // Refresh booking to get updated status from cron job
        queryClient.invalidateQueries({ queryKey: ['booking', id] });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  } else {
    setTimeRemaining(0);
  }
}, [booking, id, queryClient]);

// Format time remaining as human-readable
const formatTimeRemaining = (seconds: number) => {
  if (seconds <= 0) return 'Processing...';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

// Determine if we should show confirmation card
const needsConfirmation = booking && 
  booking.status === 'completed' &&
  !booking.completion_confirmed_at &&
  !booking.disputed_at &&
  booking.payment_status === 'authorized';
```

### 4. Add Confirmation Card UI (Insert after Payment card, before bottom actions)
```tsx
{/* Service Completion Confirmation - NEW */}
{needsConfirmation && timeRemaining > 0 && (
  <View style={styles.confirmationCard}>
    <View style={styles.confirmationHeader}>
      <Ionicons name="time-outline" size={24} color={Colors.primary} />
      <Text style={styles.confirmationTitle}>Confirm Service Completion</Text>
    </View>
    
    <Text style={styles.confirmationDescription}>
      Please confirm that the service was completed satisfactorily. 
      Payment will be automatically processed in:
    </Text>
    
    <View style={styles.timerContainer}>
      <View style={styles.timerCircle}>
        <Ionicons name="hourglass-outline" size={32} color={Colors.primary} />
      </View>
      <Text style={styles.timerText}>{formatTimeRemaining(timeRemaining)}</Text>
    </View>
    
    <View style={styles.confirmationActions}>
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={() => confirmServiceMutation.mutate()}
        disabled={confirmServiceMutation.isPending}
      >
        {confirmServiceMutation.isPending ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
            <Text style={styles.confirmButtonText}>Confirm Service</Text>
          </>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => setShowDisputeModal(true)}
        disabled={reportIssueMutation.isPending}
      >
        <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
        <Text style={styles.reportButtonText}>Report Issue</Text>
      </TouchableOpacity>
    </View>
    
    <Text style={styles.confirmationNote}>
      💡 Confirming now will immediately process your payment and allow you to rate the service.
    </Text>
  </View>
)}

{/* Confirmed Service Notice */}
{booking.completion_confirmed_at && (
  <View style={styles.confirmedCard}>
    <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
    <Text style={styles.confirmedText}>
      Service confirmed on {formatLocalDate(booking.completion_confirmed_at)}
    </Text>
  </View>
)}

{/* Disputed Service Notice */}
{booking.disputed_at && (
  <View style={styles.disputedCard}>
    <Ionicons name="alert-circle" size={24} color={Colors.warning} />
    <View style={{ flex: 1 }}>
      <Text style={styles.disputedTitle}>Issue Reported</Text>
      <Text style={styles.disputedText}>
        Your concern is under review. Admin will contact you within 24 hours.
      </Text>
      {booking.dispute_reason && (
        <Text style={styles.disputeReason}>
          Reason: {booking.dispute_reason}
        </Text>
      )}
    </View>
  </View>
)}
```

### 5. Add Dispute Modal (Add at end before </SafeAreaView>)
```tsx
{/* Dispute Modal */}
<ConfirmationModal
  visible={showDisputeModal}
  onClose={() => {
    setShowDisputeModal(false);
    setDisputeReason('');
  }}
  title="Report Service Issue"
  message="Please describe the issue with the service. Our admin will review and contact you."
  icon="alert-circle"
  iconColor={Colors.warning}
  confirmText="Submit Report"
  cancelText="Cancel"
  onConfirm={() => {
    if (disputeReason.trim().length < 10) {
      Alert.alert('Required', 'Please provide at least 10 characters describing the issue');
      return;
    }
    reportIssueMutation.mutate(disputeReason);
  }}
  isDestructive={false}
  isLoading={reportIssueMutation.isPending}
  customContent={(
    <TextInput
      style={styles.disputeInput}
      placeholder="Describe the issue (minimum 10 characters)"
      value={disputeReason}
      onChangeText={setDisputeReason}
      multiline
      numberOfLines={4}
      textAlignVertical="top"
    />
  )}
/>
```

### 6. Add Styles (Add to StyleSheet.create)
```typescript
confirmationCard: {
  margin: 16,
  padding: 20,
  backgroundColor: Colors.infoLight,
  borderRadius: 16,
  borderWidth: 2,
  borderColor: Colors.primary,
},
confirmationHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
  gap: 12,
},
confirmationTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: Colors.text.primary,
  flex: 1,
},
confirmationDescription: {
  fontSize: 14,
  color: Colors.text.secondary,
  lineHeight: 20,
  marginBottom: 20,
},
timerContainer: {
  alignItems: 'center',
  paddingVertical: 20,
  backgroundColor: Colors.white,
  borderRadius: 12,
  marginBottom: 20,
},
timerCircle: {
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: Colors.primaryLight,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 12,
},
timerText: {
  fontSize: 28,
  fontWeight: '700',
  color: Colors.primary,
},
confirmationActions: {
  gap: 12,
  marginBottom: 16,
},
confirmButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: Colors.primary,
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 12,
  gap: 8,
},
confirmButtonText: {
  fontSize: 16,
  fontWeight: '600',
  color: Colors.white,
},
reportButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: Colors.white,
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 12,
  borderWidth: 1.5,
  borderColor: Colors.error,
  gap: 8,
},
reportButtonText: {
  fontSize: 16,
  fontWeight: '600',
  color: Colors.error,
},
confirmationNote: {
  fontSize: 12,
  color: Colors.text.secondary,
  fontStyle: 'italic',
  textAlign: 'center',
},
confirmedCard: {
  margin: 16,
  padding: 16,
  backgroundColor: Colors.successLight,
  borderRadius: 12,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},
confirmedText: {
  fontSize: 14,
  color: Colors.success,
  fontWeight: '600',
},
disputedCard: {
  margin: 16,
  padding: 16,
  backgroundColor: '#FEF3C7',
  borderRadius: 12,
  flexDirection: 'row',
  gap: 12,
},
disputedTitle: {
  fontSize: 16,
  fontWeight: '700',
  color: '#92400E',
  marginBottom: 4,
},
disputedText: {
  fontSize: 14,
  color: '#78350F',
  lineHeight: 20,
},
disputeReason: {
  fontSize: 13,
  color: '#92400E',
  marginTop: 8,
  fontStyle: 'italic',
},
disputeInput: {
  backgroundColor: Colors.white,
  borderWidth: 1,
  borderColor: Colors.gray[300],
  borderRadius: 8,
  padding: 12,
  fontSize: 14,
  color: Colors.text.primary,
  minHeight: 100,
  marginTop: 12,
},
```

## Testing Checklist

- [ ] Timer shows correct countdown after barber marks booking complete
- [ ] "Confirm Service" button triggers immediate capture and updates UI
- [ ] "Report Issue" button opens modal with text input
- [ ] Dispute requires minimum 10 characters
- [ ] Successfully reporting issue cancels capture queue
- [ ] Confirmed bookings show green confirmation badge
- [ ] Disputed bookings show yellow warning badge
- [ ] Timer refreshes booking when it reaches 0
- [ ] Already confirmed/disputed bookings don't show confirmation card
- [ ] Cash payments don't show confirmation card (only card payments with authorized status)

## Deployment Steps

1. Run migration: `supabase/migrations/20251111_service_completion_confirmation_queue.sql`
2. Deploy Edge Function: `supabase functions deploy process-capture-queue`
3. Set up cron job in Supabase Dashboard:
   - Name: `process-capture-queue`
   - Schedule: `*/5 * * * *` (every 5 minutes)
   - Function: `process-capture-queue`
4. Update customer app code with UI changes above
5. Test in staging environment first
6. Deploy to production

## Notes

- The cron job runs every 5 minutes to process due captures
- Maximum 3 retry attempts per capture
- Failed captures after 3 retries stay in queue as 'failed' status
- Admin dashboard should be built to monitor failed captures
- Push notifications for confirmation reminders can be added later
