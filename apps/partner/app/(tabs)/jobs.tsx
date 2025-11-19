import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, TextInput, Modal, Alert, RefreshControl, Linking, Platform, Image, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { getStatusColor, getStatusBackground } from '@/shared/constants/colors';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { Booking, BookingStatus } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import * as Device from 'expo-device';
import { locationTrackingService } from '@mari-gunting/shared/services/locationTrackingService';
import { bookingService } from '@mari-gunting/shared/services/bookingService';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { uploadEvidencePhoto } from '@mari-gunting/shared/services/storage';
import { useLocalSearchParams, router } from 'expo-router';
import { formatTime, formatLocalDate, formatLocalTime } from '@/utils/format';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, theme } from '@mari-gunting/shared/theme';

type FilterStatus = 'all' | 'pending' | 'active' | 'completed';

type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
};

export default function PartnerJobsScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ jobId?: string }>();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<Booking | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewBookingAlert, setShowNewBookingAlert] = useState(false);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); // Loading state for status updates
  
  // Pagination handled by useInfiniteQuery cache
  
  // Completion flow state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionChecklist, setCompletionChecklist] = useState<ChecklistItem[]>([]);
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const processedJobId = useRef<string | null>(null);

  // Fetch barber ID from barbers table using user_id
  useEffect(() => {
    const fetchBarberId = async () => {
      if (!currentUser?.id) return;
      
      const { data, error } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();
      
      if (error) {
        console.error('❌ Error fetching barber ID:', error);
        return;
      }
      
      console.log('✅ Barber ID found:', data.id);
      setBarberId(data.id);
    };
    
    fetchBarberId();
  }, [currentUser?.id]);

  // Fetch barber bookings with infinite query (best practice)
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = useInfiniteQuery({
    queryKey: ['barber-bookings', barberId, filterStatus],
    enabled: !!barberId,
    queryFn: async ({ pageParam = 0 }) => {
      if (!barberId) return { success: false, data: [], offset: 0 };

      // Map filter to database statuses
      let statusFilter: string | null = null;
      if (filterStatus === 'pending') statusFilter = 'pending';
      else if (filterStatus === 'active') statusFilter = 'accepted,on_the_way,arrived,in_progress';
      else if (filterStatus === 'completed') statusFilter = 'completed';

      // Load 20 at a time, filtered by status
      const result = await bookingService.getBarberBookings(
        barberId,
        statusFilter,
        20,
        pageParam
      );
      return { ...result, offset: pageParam };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.success && Array.isArray(lastPage.data) && lastPage.data.length === 20) {
        return (lastPage.offset || 0) + 20;
      }
      return undefined;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });

  // Flatten and dedupe pages
  const partnerJobs = useMemo(() => {
    const pages = data?.pages ?? [];
    const merged: any[] = [];
    const seen = new Set<string>();
    for (const page of pages) {
      for (const j of page?.data ?? []) {
        if (!seen.has(j.id)) {
          seen.add(j.id);
          merged.push(j);
        }
      }
    }
    return merged;
  }, [data]);

  // INFINITE SCROLL: Load more when scrolling to bottom
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // GRAB STANDARD: Refetch data AND handle jobId navigation on screen focus
  useFocusEffect(
    useCallback(() => {
      console.log('👀 Jobs screen focused');

      // ALWAYS refetch when screen is focused (fixes tab switching bug)
      refetch();

      // Handle jobId navigation from Dashboard
      if (params.jobId && partnerJobs.length > 0 && processedJobId.current !== params.jobId) {
        console.log('🔄 Screen focused with jobId:', params.jobId);
        
        // Find the job first
        const jobToOpen = partnerJobs.find(j => j.id === params.jobId);
        if (jobToOpen) {
          console.log('📂 Auto-opening job from Dashboard:', params.jobId);
          
          // Mark this jobId as processed to prevent re-opening
          processedJobId.current = params.jobId;
          
          // Set filter based on actual job status
          console.log('📊 Job status:', jobToOpen.status);
          if (jobToOpen.status === 'pending') {
            console.log('✅ Setting filter to: pending');
            setFilterStatus('pending');
          } else if (['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(jobToOpen.status)) {
            console.log('✅ Setting filter to: active');
            setFilterStatus('active');
          } else if (['completed', 'cancelled', 'rejected', 'expired'].includes(jobToOpen.status)) {
            console.log('✅ Setting filter to: completed');
            setFilterStatus('completed');
          } else {
            console.log('⚠️ Unknown status, setting filter to: all');
            setFilterStatus('all');
          }
          
          // Open the modal
          setSelectedJob(jobToOpen);
          
          // Clear params to prevent re-opening on next focus
          setTimeout(() => {
            router.setParams({ jobId: undefined });
          }, 100);
        }
      }
    }, [params.jobId, partnerJobs, refetch])
  );

  // CRITICAL: Auto-update selectedJob when data refreshes from backend
  // Optimized to only update when status or timestamps change (prevent unnecessary re-renders)
  // Preserves customer data to prevent avatar flickering
  useEffect(() => {
    if (selectedJob && partnerJobs.length > 0) {
      const updatedJob = partnerJobs.find(j => j.id === selectedJob.id);
      if (updatedJob) {
        // Only update if status or timestamp fields changed
        const statusChanged = updatedJob.status !== selectedJob.status;
        const timestampsChanged = 
          updatedJob.accepted_at !== selectedJob.accepted_at ||
          updatedJob.on_the_way_at !== selectedJob.on_the_way_at ||
          updatedJob.arrived_at !== selectedJob.arrived_at ||
          updatedJob.started_at !== selectedJob.started_at;
        
        // FIX: Also update when payment completes (payment_status, distance, address populated)
        const paymentChanged = updatedJob.payment_status !== selectedJob.payment_status;
        const distanceChanged = updatedJob.distance !== selectedJob.distance;
        const addressChanged = JSON.stringify(updatedJob.customer_address || updatedJob.address) !== 
          JSON.stringify(selectedJob.customer_address || selectedJob.address);
        
        if (statusChanged || timestampsChanged || paymentChanged || distanceChanged || addressChanged) {
          console.log('🔄 Auto-updating selectedJob:', {
            statusChanged,
            timestampsChanged,
            paymentChanged,
            distanceChanged,
            addressChanged
          });
          
          // PRODUCTION FIX: Preserve customer data if it's missing in update
          // Prevents avatar from disappearing during real-time updates
          const mergedJob = {
            ...updatedJob,
            customer: updatedJob.customer?.avatar 
              ? updatedJob.customer 
              : selectedJob.customer // Keep existing customer data if avatar missing
          };
          
          setSelectedJob(mergedJob);
        }
      }
    }
  }, [partnerJobs, selectedJob?.id, selectedJob?.status, selectedJob?.payment_status, selectedJob?.distance, selectedJob?.customer_address, selectedJob?.address, selectedJob?.accepted_at, selectedJob?.on_the_way_at, selectedJob?.arrived_at, selectedJob?.started_at]);

  // OPTIMIZED: Single real-time subscription for all booking changes (3→1 connection)
  // Handles both INSERT (new bookings) and UPDATE (status changes)
  // Reduces realtime connections from 3 per barber to 1 per barber
  useEffect(() => {
    if (!barberId) return;

    console.log('🔊 Setting up optimized realtime subscription for barber:', barberId);

    const channel = supabase
      .channel(`barber-bookings-${barberId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT + UPDATE)
          schema: 'public',
          table: 'bookings',
          filter: `barber_id=eq.${barberId}`,
        },
        async (payload) => {
          console.log(`📡 Booking ${payload.eventType}:`, payload);
          
          // Handle INSERT - New booking
          if (payload.eventType === 'INSERT') {
            console.log('🔔 New booking received!', payload);
            
            Alert.alert(
              '🔔 New Booking Request!',
              'You have a new booking request. Tap to view.',
              [
                { text: 'Later', style: 'cancel' },
                { 
                  text: 'View Now', 
                  onPress: () => {
                    queryClient.invalidateQueries({ queryKey: ['barber-bookings'] });
                    queryClient.invalidateQueries({ queryKey: ['barber-booking-counts'] });
                    setFilterStatus('pending');
                  }
                }
              ]
            );
          }
          
          // Handle UPDATE - Booking status/data changed
          if (payload.eventType === 'UPDATE') {
            console.log('🔄 Booking updated in real-time:', payload.new);
            
            const newJob = payload.new as Booking;
            
            // Check if this is the currently selected job
            setSelectedJob((current) => {
              if (current && current.id === newJob.id) {
                console.log('✅ Updating selected job:', newJob.status);
                
                // For important status changes, fetch full booking data asynchronously
                const importantStatuses = ['cancelled', 'rejected', 'accepted', 'completed', 'expired'];
                const statusChanged = newJob.status !== current.status;
                
                if (statusChanged && importantStatuses.includes(newJob.status)) {
                  console.log(`🔄 Fetching full booking data for status change: ${current.status} → ${newJob.status}`);
                  
                  // Fetch full booking data in background
                  bookingService.getBookingById(newJob.id).then((fullBooking) => {
                    if (fullBooking.success && fullBooking.data) {
                      console.log('✅ Full booking data fetched');
                      setSelectedJob(fullBooking.data);
                    }
                  }).catch((error) => {
                    console.error('❌ Error fetching full booking:', error);
                  });
                }
                
                // Immediately update with payload data (preserving customer)
                return {
                  ...newJob,
                  customer: newJob.customer?.avatar ? newJob.customer : current.customer
                };
              }
              return current;
            });
          }
          
          // Refresh list and counts for both INSERT and UPDATE
          queryClient.invalidateQueries({ queryKey: ['barber-bookings'] });
          queryClient.invalidateQueries({ queryKey: ['barber-booking-counts'] });
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime connection status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [barberId, queryClient]);

  // Mutation for updating booking status
  const updateStatusMutation = useMutation({
    mutationFn: ({ bookingId, newStatus }: { bookingId: string; newStatus: string }) =>
      bookingService.updateBookingStatus(bookingId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barber-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['barber-booking-counts'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update status');
    },
  });

  // Mutation for confirming cash payment
  const confirmCashMutation = useMutation({
    mutationFn: ({ bookingId, barberId }: { bookingId: string; barberId: string }) => 
      bookingService.confirmCashPayment(bookingId, barberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barber-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['barber-booking-counts'] });
      Alert.alert('✅ Payment Confirmed', 'Cash payment has been recorded.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to confirm payment');
    },
  });

  // GRAB STANDARD: Fetch counts for all filters (lightweight, always visible)
  const { data: countsData } = useQuery({
    queryKey: ['barber-booking-counts', barberId],
    queryFn: async () => {
      if (!barberId) return { all: 0, pending: 0, active: 0, completed: 0 };
      const result = await bookingService.getBarberBookingCounts(barberId);
      return result.success ? result.data : { all: 0, pending: 0, active: 0, completed: 0 };
    },
    enabled: !!barberId,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnMount: true,
  });

  // Apply search filter (status already filtered by database)
  const filteredJobs = useMemo(() => {
    let jobs = partnerJobs; // Already filtered by status in database query

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      jobs = jobs.filter(j => 
        j.customer?.name.toLowerCase().includes(query) ||
        j.services?.some(s => s.name.toLowerCase().includes(query))
      );
    }

    // Sort by date (newest first) - database already sorts, but keep for consistency
    return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [partnerJobs, searchQuery]);

  // GRAB STANDARD: Show actual counts for all filters (from separate lightweight query)
  const filterCounts = countsData || { all: 0, pending: 0, active: 0, completed: 0 };

  // Calculate analytics for completed jobs
  const completedJobsAnalytics = useMemo(() => {
    const completed = partnerJobs.filter(j => j.status === 'completed');
    const totalEarnings = completed.reduce((sum, job) => sum + (job.totalPrice || 0), 0);
    const totalJobs = completed.length;
    const averageEarning = totalJobs > 0 ? totalEarnings / totalJobs : 0;
    
    // Calculate this month's stats (using UTC to avoid timezone issues - Grab-style)
    const now = new Date();
    const thisMonth = completed.filter(job => {
      const jobDate = new Date(job.completedAt || job.updatedAt);
      // Use UTC methods for consistent month boundaries across timezones
      return jobDate.getUTCMonth() === now.getUTCMonth() && jobDate.getUTCFullYear() === now.getUTCFullYear();
    });
    const monthlyEarnings = thisMonth.reduce((sum, job) => sum + (job.totalPrice || 0), 0);
    const monthlyJobs = thisMonth.length;

    return {
      totalEarnings,
      totalJobs,
      averageEarning,
      monthlyEarnings,
      monthlyJobs,
      completedJobs: completed,
    };
  }, [partnerJobs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAcceptJob = (job: Booking) => {
    Alert.alert(
      'Accept Job',
      `Accept booking from ${job.customer?.full_name || job.customer?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setIsUpdatingStatus(true);
            try {
              // SMART OPTIMISTIC UPDATE: Preserve ALL existing data
              const optimisticJob = { 
                ...job, 
                status: 'accepted' as BookingStatus,
                accepted_at: new Date().toISOString(),
                // Preserve all critical fields
                customer: job.customer,
                services: job.services,
                travelCost: job.travelCost,
                distance: job.distance,
                address: job.address
              };
              setSelectedJob(optimisticJob);
              
              // Update backend - this will also capture payment if Curlec
              await updateStatusMutation.mutateAsync({ 
                bookingId: job.id, 
                newStatus: 'accepted' 
              });
              
              // SAFETY BACKUP: Ensure location service is running (in case Dashboard didn't start it)
              if (currentUser?.id && !locationTrackingService.isCurrentlyTracking()) {
                console.log('🔄 Location service not running, starting in idle mode...');
                await locationTrackingService.startTracking(currentUser.id, 'idle');
                console.log('✅ Location service started as backup');
              }
              
              // Fetch complete data (loading overlay masks the transition)
              console.log('🔄 Fetching updated booking after accept...');
              const updatedBooking = await bookingService.getBookingById(job.id);
              if (updatedBooking.success && updatedBooking.data) {
                console.log('✅ Updated booking fetched:', updatedBooking.data.status);
                setSelectedJob(updatedBooking.data);
              }
              
              setIsUpdatingStatus(false);
              Alert.alert(
                '✅ Job Accepted', 
                'Great! You can now start heading to the customer location.',
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              setIsUpdatingStatus(false);
              // Rollback on error
              setSelectedJob(job);
              Alert.alert('Error', error.message || 'Failed to accept job');
            }
          },
        },
      ]
    );
  };

  const handleRejectJob = (job: Booking) => {
    Alert.alert(
      'Decline Booking',
      `Are you sure you want to decline this booking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            await updateStatusMutation.mutateAsync({ 
              bookingId: job.id, 
              newStatus: 'rejected' 
            });
            Alert.alert('Booking Declined', 'You can still view this in your history.');
            setSelectedJob(null);
          },
        },
      ]
    );
  };

  const handleOnTheWay = async (job: Booking) => {
    Alert.alert(
      "I'm on the way",
      `Let ${job.customer?.full_name || job.customer?.name} know you're heading to their location?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: "I'm on the way",
          onPress: async () => {
            setIsUpdatingStatus(true);
            try {
              // Smart optimistic update
              const optimisticJob = { 
                ...job, 
                status: 'on_the_way' as BookingStatus,
                on_the_way_at: new Date().toISOString(),
                // Preserve all critical fields
                customer: job.customer,
                services: job.services,
                travelCost: job.travelCost,
                distance: job.distance,
                address: job.address
              };
              setSelectedJob(optimisticJob);
              
              await updateStatusMutation.mutateAsync({ 
                bookingId: job.id, 
                newStatus: 'on_the_way' 
              });
              
              // SAFETY BACKUP: Ensure location service is running before switching mode
              if (currentUser?.id) {
                if (!locationTrackingService.isCurrentlyTracking()) {
                  console.log('⚠️ Location service not running, starting now...');
                  await locationTrackingService.startTracking(currentUser.id, 'on-the-way');
                  console.log('✅ Location service started in on-the-way mode');
                } else {
                  await locationTrackingService.switchMode(currentUser.id, 'on-the-way');
                  console.log('📍 Switched to on-the-way tracking mode');
                }
              }
              
              // Fetch updated booking data
              console.log('🔄 Fetching updated booking after on_the_way...');
              const updatedBooking = await bookingService.getBookingById(job.id);
              if (updatedBooking.success && updatedBooking.data) {
                console.log('✅ Updated booking fetched:', updatedBooking.data.status);
                setSelectedJob(updatedBooking.data);
              }
              
              setIsUpdatingStatus(false);
              Alert.alert(
                '🚗 On The Way', 
                'Customer notified! Location tracking active.\n\nTip: Use GPS for accurate navigation.',
                [{ text: 'OK' }]
              );
            } catch (err) {
              setIsUpdatingStatus(false);
              console.error('❌ Error:', err);
              setSelectedJob(job); // Rollback
              Alert.alert('Error', 'Failed to update status. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleArrived = async (job: Booking) => {
    Alert.alert(
      'Arrived at Location',
      `Confirm you've arrived at ${job.customer?.full_name || job.customer?.name}'s location?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Arrival',
          onPress: async () => {
            setIsUpdatingStatus(true);
            try {
              // Smart optimistic update
              const optimisticJob = { 
                ...job, 
                status: 'arrived' as BookingStatus,
                arrived_at: new Date().toISOString(),
                // Preserve all critical fields
                customer: job.customer,
                services: job.services,
                travelCost: job.travelCost,
                distance: job.distance,
                address: job.address
              };
              setSelectedJob(optimisticJob);
              
              await updateStatusMutation.mutateAsync({ 
                bookingId: job.id, 
                newStatus: 'arrived' 
              });
              
              // Switch back to idle mode (less frequent updates) when arrived
              if (currentUser?.id && locationTrackingService.isCurrentlyTracking()) {
                await locationTrackingService.switchMode(currentUser.id, 'idle');
                console.log('📍 Switched back to idle tracking mode');
              }
              
              // Fetch updated booking data
              console.log('🔄 Fetching updated booking after arrived...');
              const updatedBooking = await bookingService.getBookingById(job.id);
              if (updatedBooking.success && updatedBooking.data) {
                console.log('✅ Updated booking fetched:', updatedBooking.data.status);
                setSelectedJob(updatedBooking.data);
              }
              
              setIsUpdatingStatus(false);
              Alert.alert(
                '📍 Arrival Confirmed', 
                'Customer notified! Ready to start the service.',
                [{ text: 'OK' }]
              );
            } catch (err) {
              setIsUpdatingStatus(false);
              console.error('❌ Error:', err);
              setSelectedJob(job); // Rollback
              Alert.alert('Error', 'Failed to confirm arrival. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleStartJob = (job: Booking) => {
    // EVIDENCE PHOTO: Mandatory before photo (Grab standard)
    Alert.alert(
      '📸 Before Photo Required',
      'Take a photo of the customer before starting service',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '📷 Take Photo',
          onPress: () => captureBeforePhoto(job, 'camera'),
        },
      ]
    );
  };

  // Capture and upload before photo
  const captureBeforePhoto = async (job: Booking, source: 'camera' | 'library') => {
    try {
      let result: ImagePicker.ImagePickerResult;
      
      if (source === 'camera') {
        // Request camera permission
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
      } else {
        // Request library permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Photo library permission is needed.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
      }

      if (result.canceled || !result.assets || result.assets.length === 0) {
        // User cancelled - must take photo (mandatory)
        Alert.alert(
          'Photo Required',
          'Before photo is required to start service',
          [
            { text: 'OK', onPress: () => captureBeforePhoto(job, 'camera') },
          ]
        );
        return;
      }

      const photoUri = result.assets[0].uri;
      
      // Upload to Supabase (no alert, just upload silently)
      const uploadResult = await uploadEvidencePhoto(job.id, photoUri, 'before');
      
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Proceed with starting service and passing the photo URL
      proceedWithStartService(job, uploadResult.url);
      
    } catch (error: any) {
      console.error('❌ Error capturing before photo:', error);
      Alert.alert(
        'Photo Upload Failed',
        'Unable to upload photo. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => captureBeforePhoto(job, 'camera') },
        ]
      );
    }
  };

  // Proceed with starting service (with or without before photo)
  const proceedWithStartService = async (job: Booking, beforePhotoUrl: string | null) => {
    try {
      // First, update status to in_progress
      await updateStatusMutation.mutateAsync({ 
        bookingId: job.id, 
        newStatus: 'in_progress' 
      });

      // If we have a before photo, update evidence_photos field
      if (beforePhotoUrl) {
        const { error } = await supabase
          .from('bookings')
          .update({ 
            evidence_photos: { 
              before: [beforePhotoUrl], 
              after: [] 
            } 
          })
          .eq('id', job.id);

        if (error) {
          console.error('❌ Error saving before photo URL:', error);
          // Don't fail the whole operation, just log it
        }
      }

      // Fetch updated booking data
      console.log('🔄 Fetching updated booking after in_progress...');
      const updatedBooking = await bookingService.getBookingById(job.id);
      if (updatedBooking.success && updatedBooking.data) {
        console.log('✅ Updated booking fetched:', updatedBooking.data.status);
        // Merge with before photo
        const finalJob = {
          ...updatedBooking.data,
          evidence_photos: beforePhotoUrl ? { before: [beforePhotoUrl], after: [] } : updatedBooking.data.evidence_photos
        };
        setSelectedJob(finalJob);
      } else {
        // Fallback to optimistic update
        const updatedJob = { 
          ...job, 
          status: 'in_progress' as BookingStatus,
          evidence_photos: beforePhotoUrl ? { before: [beforePhotoUrl], after: [] } : undefined
        };
        setSelectedJob(updatedJob);
      }

      // Update local state for completion modal
      if (beforePhotoUrl) {
        setBeforePhotos([beforePhotoUrl]);
      }
      
      Alert.alert(
        '✂️ Service Started', 
        beforePhotoUrl 
          ? '📸 Before photo saved! Timer started. Take your time and do great work!' 
          : 'Timer started. Take your time and do great work!',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('❌ Error starting service:', error);
      setSelectedJob(job); // Rollback
      Alert.alert('Error', error.message || 'Failed to start service');
    }
  };

  const handleCompleteJob = (job: Booking) => {
    // Ensure job data is available
    if (!job || !job.id) {
      Alert.alert('Error', 'Unable to load job details');
      return;
    }
    
    // Load existing evidence photos if available
    if (job.evidence_photos) {
      if (job.evidence_photos.before && job.evidence_photos.before.length > 0) {
        setBeforePhotos(job.evidence_photos.before);
        console.log('📸 Loaded before photos:', job.evidence_photos.before);
      }
      // Don't load after photos as user needs to take fresh ones
    }
    
    // SMART CHECKLIST: Different items based on payment method (Grab standard)
    const isCashPayment = job.payment_method === 'cash';
    const checklistItems: ChecklistItem[] = [
      { id: '1', label: 'Service completed to customer satisfaction', checked: false },
      { id: '2', label: 'Customer location was accurate', checked: false },
      { id: '3', label: 'Area cleaned up and tidy', checked: false },
      { id: '4', label: 'Photos taken (before/after)', checked: false },
      ...(isCashPayment 
        ? [{ id: '5', label: `Cash collected: RM ${job.totalPrice || job.total_price}`, checked: false }]
        : [{ id: '5', label: 'Payment authorized successfully', checked: false }]
      ),
    ];
    
    setCompletionChecklist(checklistItems);
    // Open completion modal
    setShowCompletionModal(true);
  };
  
  const handleFinalizeCompletion = () => {
    const allChecked = completionChecklist.every(item => item.checked);
    
    if (!allChecked) {
      Alert.alert(
        'Incomplete Checklist',
        'Please complete all checklist items before finishing.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (afterPhotos.length === 0) {
      Alert.alert(
        '📸 After Photo Required',
        'Please take at least one photo of your completed work',
        [
          { text: 'OK', onPress: () => takePhoto('after') }
        ]
      );
      return;
    }
    
    finalizeJobCompletion();
  };
  
  const finalizeJobCompletion = async () => {
    if (!selectedJob) return;

    try {
      setIsSubmitting(true);
      
      // EVIDENCE PHOTO: Upload after photos first (if any)
      let afterPhotoUrls: string[] = [];
      
      if (afterPhotos.length > 0) {
        // Upload all after photos in parallel (no alert, just loading state)
        const uploadPromises = afterPhotos.map(photoUri => 
          uploadEvidencePhoto(selectedJob.id, photoUri, 'after')
        );
        
        const uploadResults = await Promise.all(uploadPromises);
        
        // Collect successful uploads
        afterPhotoUrls = uploadResults
          .filter(result => result.success && result.url)
          .map(result => result.url!);
        
        // Check if all uploads succeeded
        if (afterPhotoUrls.length !== afterPhotos.length) {
          setIsSubmitting(false);
          const failedCount = afterPhotos.length - afterPhotoUrls.length;
          Alert.alert(
            'Upload Warning',
            `${failedCount} photo(s) failed to upload. Continue anyway?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Continue', onPress: async () => await completeJobWithPhotos(afterPhotoUrls) },
            ]
          );
          return;
        }
      }
      
      await completeJobWithPhotos(afterPhotoUrls);
      
    } catch (error: any) {
      console.error('❌ Error completing job:', error);
      setIsSubmitting(false);
      Alert.alert('Error', error.message || 'Failed to complete job. Please try again.');
    }
  };
  
  // Complete job with uploaded photo URLs
  const completeJobWithPhotos = async (afterPhotoUrls: string[]) => {
    if (!selectedJob) return;
    
    try {
      // Update evidence_photos with after photos
      if (afterPhotoUrls.length > 0) {
        // IMPORTANT: Fetch latest evidence_photos from database to avoid overwriting before photos
        const { data: latestBooking } = await supabase
          .from('bookings')
          .select('evidence_photos')
          .eq('id', selectedJob.id)
          .single();
        
        const currentBeforePhotos = latestBooking?.evidence_photos?.before || selectedJob.evidence_photos?.before || beforePhotos;
        
        const { error } = await supabase
          .from('bookings')
          .update({ 
            evidence_photos: { 
              before: currentBeforePhotos, 
              after: afterPhotoUrls 
            } 
          })
          .eq('id', selectedJob.id);

        if (error) {
          console.error('❌ Error saving after photo URLs:', error);
          // Don't fail the whole operation, just log it
        } else {
          console.log('✅ Evidence photos saved:', { before: currentBeforePhotos.length, after: afterPhotoUrls.length });
        }
      }
      
      // Update job status to completed
      await updateStatusMutation.mutateAsync({ 
        bookingId: selectedJob.id, 
        newStatus: 'completed' 
      });

      // If cash payment, confirm it was collected
      if (selectedJob.payment_method === 'cash' && currentUser?.id) {
        await confirmCashMutation.mutateAsync({
          bookingId: selectedJob.id,
          barberId: currentUser.id,
        });
      }

      // Calculate actual earnings (services 85% + full travel cost)
      const servicesTotal = selectedJob.services?.reduce((sum, s) => sum + s.price, 0) || 0;
      const travelCost = selectedJob.travelCost || 0;
      const actualEarnings = (servicesTotal * 0.85) + travelCost;
      
      // Payment message based on method
      const isCash = selectedJob.payment_method === 'cash';
      const isCardPayment = ['card', 'curlec_card', 'curlec_fpx'].includes(selectedJob.payment_method);
      
      let alertTitle = 'Job Completed! 🎉';
      let alertMessage = '';
      
      if (isCash) {
        alertMessage = `Great work! You earned RM ${actualEarnings.toFixed(2)}\n\n✅ Cash collected from customer\n💰 Available immediately in your earnings`;
      } else if (isCardPayment) {
        alertMessage = `Great work! You earned RM ${actualEarnings.toFixed(2)}\n\n⏳ Payment is on hold pending customer confirmation\n💰 Funds will be available after customer rates the service or auto-confirms in 2 hours`;
      } else {
        alertMessage = `Great work! You earned RM ${actualEarnings.toFixed(2)}\n\nPayment will be credited to your account.`;
      }

      setIsSubmitting(false);
      
      Alert.alert(
        alertTitle,
        alertMessage,
        [
          {
            text: 'Done',
            onPress: () => {
              setShowCompletionModal(false);
              setSelectedJob(null);
              // Reset completion state
              setCompletionChecklist([]);
              setBeforePhotos([]);
              setAfterPhotos([]);
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('❌ Error completing job:', error);
      setIsSubmitting(false);
      Alert.alert('Error', error.message || 'Failed to complete job. Please try again.');
    }
  };
  
  const toggleChecklistItem = (id: string) => {
    setCompletionChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };
  
  const pickImage = async (type: 'before' | 'after') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Please grant photo library permissions in Settings to add photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        if (type === 'before') {
          setBeforePhotos(prev => [...prev, photoUri]);
        } else {
          setAfterPhotos(prev => [...prev, photoUri]);
        }
      }
    } catch (error) {
      Alert.alert(
        'Error', 
        `Failed to pick image: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
      );
    }
  };
  
  const takePhoto = async (type: 'before' | 'after') => {
    try {
      // Check if running on simulator
      const isSimulator = !Device.isDevice;
      
      if (isSimulator) {
        Alert.alert(
          'Camera Not Available',
          'Camera is not available on simulator. Please use "Choose from Library" instead.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Please grant camera permissions in Settings to take photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        
        if (!photoUri || typeof photoUri !== 'string' || photoUri.trim() === '') {
          Alert.alert('Error', 'Failed to capture photo. Please try again.');
          return;
        }
        
        if (type === 'before') {
          setBeforePhotos(prev => [...prev, photoUri]);
        } else {
          setAfterPhotos(prev => [...prev, photoUri]);
        }
      }
    } catch (error: any) {
      if (error.message && error.message.includes('Camera not available')) {
        Alert.alert(
          'Camera Not Available',
          'Camera is not available on this device. Please use "Choose from Library" instead.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error', 
          `Failed to take photo: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
        );
      }
    }
  };
  
  const removePhoto = (type: 'before' | 'after', index: number) => {
    if (type === 'before') {
      setBeforePhotos(prev => prev.filter((_, i) => i !== index));
    } else {
      setAfterPhotos(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  const showPhotoOptions = (type: 'before' | 'after') => {
    // After photos must be camera only for authenticity
    takePhoto(type);
  };

  // Week 4: Navigation & Contact handlers
  const handleCallCustomer = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleChatCustomer = (bookingId: string) => {
    // Close modal first
    setSelectedJob(null);
    // Navigate to chat
    setTimeout(() => {
      router.push(`/jobs/chat/${bookingId}` as any);
    }, 300);
  };

  const handleGetDirections = async (address: string, latitude?: number | string, longitude?: number | string) => {
    // Coerce possible string coords to numbers
    const latF = latitude !== undefined && latitude !== null ? Number(latitude) : NaN;
    const lngF = longitude !== undefined && longitude !== null ? Number(longitude) : NaN;
    const hasCoords = Number.isFinite(latF) && Number.isFinite(lngF);
    const coords = hasCoords ? `${latF},${lngF}` : encodeURIComponent(address);
    
    // iOS: Show choice of navigation apps
    if (Platform.OS === 'ios') {
      const options: string[] = ['Apple Maps'];
      const urls: string[] = [
        latitude && longitude 
          ? `maps://app?daddr=${coords}`
          : `maps://app?daddr=${encodeURIComponent(address)}`
      ];
      
      // Check if Google Maps is installed
      const googleMapsUrl = latitude && longitude
        ? `comgooglemaps://?daddr=${coords}`
        : `comgooglemaps://?daddr=${encodeURIComponent(address)}`;
      
      try {
        const hasGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
        console.log('🗺️ Google Maps detection:', hasGoogleMaps);
        if (hasGoogleMaps) {
          options.push('Google Maps');
          urls.push(googleMapsUrl);
        }
      } catch (e) {
        console.log('❌ Google Maps check failed:', e);
      }
      
      // Check if Waze is installed
      const wazeUrl = latitude && longitude
        ? `waze://?ll=${coords}&navigate=yes`
        : `waze://?q=${encodeURIComponent(address)}&navigate=yes`;
      
      try {
        const hasWaze = await Linking.canOpenURL(wazeUrl);
        console.log('🚗 Waze detection:', hasWaze);
        if (hasWaze) {
          options.push('Waze');
          urls.push(wazeUrl);
        }
      } catch (e) {
        console.log('❌ Waze check failed:', e);
      }
      
      options.push('Cancel');
      
      // Show action sheet
      Alert.alert(
        'Open in Navigation App',
        'Choose your preferred navigation app:',
        [
          ...options.slice(0, -1).map((option, index) => ({
            text: option,
            onPress: () => Linking.openURL(urls[index])
          })),
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      // Android: Prefer Google Navigation intent with pure coordinates, then fall back progressively.
      const candidates: string[] = [];
      if (hasCoords) {
        // 1) Google turn-by-turn navigation (best for exact coordinates)
        candidates.push(`google.navigation:q=${latF},${lngF}&mode=d`);
        // 2) Geo URI centered on exact coords (no search query/label)
        candidates.push(`geo:${latF},${lngF}`);
        // 3) Geo URI with query = coords (still pure coords, no label)
        candidates.push(`geo:0,0?q=${latF},${lngF}`);
      } else {
        // No coords, fall back to searching the address
        candidates.push(`geo:0,0?q=${encodeURIComponent(address)}`);
      }

      try {
        let opened = false;
        for (const candidate of candidates) {
          // eslint-disable-next-line no-await-in-loop
          const supported = await Linking.canOpenURL(candidate);
          if (supported) {
            Linking.openURL(candidate);
            opened = true;
            break;
          }
        }
        if (!opened) {
          // Final fallback: Google Maps via browser with coordinates if available
          const googleMapsUrl = hasCoords
            ? `https://www.google.com/maps/dir/?api=1&destination=${latF},${lngF}&travelmode=driving`
            : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;
          Linking.openURL(googleMapsUrl);
        }
      } catch (error) {
        Alert.alert('Error', 'Unable to open maps application');
      }
    }
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F4F7" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jobs</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            Alert.alert(
              'Sort & Filter Options',
              'Advanced sorting and filtering options coming soon!\n\n• Sort by date\n• Sort by price\n• Filter by distance\n• Filter by service type',
              [{ text: 'OK' }]
            );
          }}
        >
          <Ionicons name="options-outline" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.text.tertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs, customers..."
          placeholderTextColor={COLORS.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterTabs}
        contentContainerStyle={styles.filterTabsContent}
      >
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              filterStatus === filter.key && styles.filterTabActive,
            ]}
            onPress={() => setFilterStatus(filter.key as FilterStatus)}
          >
            <Text
              style={[
                styles.filterTabText,
                filterStatus === filter.key && styles.filterTabTextActive,
              ]}
            >
              {filter.label}
            </Text>
            <View
              style={[
                styles.filterBadge,
                filterStatus === filter.key && styles.filterBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.filterBadgeText,
                  filterStatus === filter.key && styles.filterBadgeTextActive,
                ]}
              >
                {filterCounts[filter.key as keyof typeof filterCounts]}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Jobs List - FlatList for virtualization */}
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item: job }) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              activeOpacity={0.7}
              onPress={() => setSelectedJob(job)}
            >
              {/* Job Card Content */}
              <View style={styles.jobCardHeader}>
                <View style={styles.jobCardLeft}>
                  <View style={[styles.jobStatusDot, { backgroundColor: getStatusColor(job.status) }]} />
                  <View>
                    <Text style={styles.jobCustomerName}>{job.customer?.name || 'Customer'}</Text>
                    <Text style={styles.jobDate}>
                      {/* PRODUCTION: Use scheduled_datetime for timezone-aware display */}
                      {job.scheduled_datetime 
                        ? `${formatLocalDate(job.scheduled_datetime, 'short')} • ${formatLocalTime(job.scheduled_datetime)}`
                        : `${job.scheduledDate} • ${formatTime(job.scheduledTime)}`
                      }
                    </Text>
                  </View>
                </View>
                <View style={[styles.jobStatusBadge, { backgroundColor: getStatusBackground(job.status) }]}>
                  <Text style={[styles.jobStatusText, { color: getStatusColor(job.status) }]}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1).replace(/[-_]/g, ' ')}
                  </Text>
                </View>
              </View>

              <View style={styles.jobCardBody}>
                <View style={styles.jobInfoRow}>
                  <Ionicons name="cut" size={16} color={COLORS.text.secondary} />
                  <Text style={styles.jobInfoText}>
                    {(() => {
                      const services = job.services || [];
                      if (services.length === 0) return 'Service';
                      if (services.length <= 2) return services.map(s => s.name).join(', ');
                      return `${services[0].name}, ${services[1].name} +${services.length - 2} more`;
                    })()}
                  </Text>
                </View>
                <View style={styles.jobInfoRow}>
                  <Ionicons name="location" size={16} color={COLORS.text.secondary} />
                  <Text style={styles.jobInfoText} numberOfLines={1}>
                    {job.distance ? `${job.distance.toFixed(1)} km away • ` : ''}{job.address?.area || job.address?.fullAddress || 'Location'}
                  </Text>
                </View>
                {/* Payment Method Badge */}
                <View style={styles.paymentMethodContainer}>
                  <View style={[
                    styles.paymentMethodBadge,
                    job.payment_method === 'cash' && styles.paymentMethodCash
                  ]}>
                    <Ionicons 
                      name={job.payment_method === 'cash' ? 'cash-outline' : 'card-outline'} 
                      size={14} 
                      color={job.payment_method === 'cash' ? Colors.warning : Colors.success} 
                    />
                    <Text style={styles.paymentMethodText}>
                      {job.payment_method === 'cash' ? 'CASH' : 'CARD'}
                    </Text>
                  </View>
                  {job.payment_method === 'cash' && job.payment_status === 'pending' && (
                    <Text style={styles.paymentInstructionText}>
                      💵 Collect after service
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.jobCardFooter}>
                <Text style={styles.jobPrice}>
                  RM {(() => {
                    const servicesTotal = job.services?.reduce((sum, s) => sum + s.price, 0) || 0;
                    const travelCost = job.travelCost || 0;
                    const earnings = (servicesTotal * 0.85) + travelCost;
                    return earnings.toFixed(2);
                  })()}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
              </View>
            </TouchableOpacity>
        )}
        style={styles.jobsList}
        contentContainerStyle={styles.jobsListContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons 
              name={searchQuery ? 'search' : 'briefcase-outline'} 
              size={64} 
              color={COLORS.text.tertiary} 
            />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No Results Found' : 'No Jobs Yet'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? 'Try adjusting your search or filters'
                : 'Your bookings will appear here'}
            </Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage && hasNextPage ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={{ marginTop: 8, color: COLORS.text.tertiary, fontSize: 12 }}>Loading more...</Text>
            </View>
          ) : !hasNextPage && filteredJobs.length > 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: COLORS.text.tertiary, fontSize: 12 }}>No more jobs</Text>
            </View>
          ) : (
            <View style={{ height: 20 }} />
          )
        }
      />

      {/* Job Details Modal */}
      <Modal
        visible={selectedJob !== null && !showCompletionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setSelectedJob(null);
          processedJobId.current = null;
        }}
      >
        {selectedJob && !showCompletionModal && (
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setSelectedJob(null);
                // Reset processedJobId to allow re-navigation from Dashboard
                processedJobId.current = null;
              }}>
                <Ionicons name="close" size={28} color={COLORS.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Job Details</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Booking Number & Payment Method */}
              <View style={styles.bookingInfoHeader}>
                <View style={styles.bookingNumberContainer}>
                  <Text style={styles.bookingNumberLabel}>Booking ID</Text>
                  <Text style={styles.bookingNumber}>{selectedJob.booking_number || selectedJob.bookingNumber || 'N/A'}</Text>
                </View>
                <View style={styles.paymentMethodBadgeLarge}>
                  <Ionicons 
                    name={selectedJob.payment_method === 'cash' ? 'cash-outline' : 'card-outline'} 
                    size={18} 
                    color={selectedJob.payment_method === 'cash' ? Colors.warning : Colors.success} 
                  />
                  <Text style={[styles.paymentMethodTextLarge, { color: selectedJob.payment_method === 'cash' ? Colors.warning : Colors.success }]}>
                    {selectedJob.payment_method === 'cash' ? 'CASH' : 
                     selectedJob.payment_method === 'curlec_card' || selectedJob.payment_method === 'card' ? 'CARD' : 
                     selectedJob.payment_method === 'curlec_fpx' ? 'FPX' : 'ONLINE'}
                  </Text>
                </View>
              </View>

              {/* Status Banner */}
              <View style={[styles.statusBanner, { backgroundColor: getStatusBackground(selectedJob.status) }]}>
                <Ionicons name="information-circle" size={24} color={getStatusColor(selectedJob.status)} />
                <Text style={[styles.statusBannerText, { color: getStatusColor(selectedJob.status) }]}>
                  {selectedJob.status === 'pending' && 'Waiting for your response'}
                  {selectedJob.status === 'accepted' && (
                    ['card', 'curlec_card', 'curlec_fpx'].includes(selectedJob.payment_method) && selectedJob.payment_status !== 'authorized'
                      ? 'Waiting for customer payment authorization'
                      : 'Job accepted, ready to start'
                  )}
                  {selectedJob.status === 'on_the_way' && 'On the way to customer'}
                  {selectedJob.status === 'arrived' && 'Arrived at customer location'}
                  {selectedJob.status === 'in_progress' && 'Job in progress'}
                  {selectedJob.status === 'completed' && 'Job completed successfully'}
                  {selectedJob.status === 'cancelled' && 'This job was cancelled'}
                  {selectedJob.status === 'rejected' && 'You declined this booking'}
                  {selectedJob.status === 'expired' && 'No response within 3 minutes - booking expired'}
                </Text>
              </View>

              {/* Progress Timeline - Only show for active jobs */}
              {!['completed', 'cancelled', 'rejected', 'expired', 'pending'].includes(selectedJob.status) && (
                <View style={styles.timelineSection}>
                  <Text style={styles.timelineSectionTitle}>Job Progress</Text>
                  <View style={styles.timeline}>
                    {/* Accepted */}
                    <View style={styles.timelineItem}>
                      <View style={styles.timelineIndicator}>
                        <View style={[styles.timelineDot, styles.timelineDotCompleted]}>
                          <Ionicons name="checkmark" size={12} color={COLORS.background.primary} />
                        </View>
                        {selectedJob.status !== 'accepted' && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>Accepted</Text>
                        <Text style={styles.timelineTime}>
                          {selectedJob.accepted_at ? formatLocalTime(selectedJob.accepted_at) : 'Job accepted'}
                        </Text>
                      </View>
                    </View>

                    {/* On the way */}
                    <View style={styles.timelineItem}>
                      <View style={styles.timelineIndicator}>
                        <View style={[
                          styles.timelineDot,
                          ['on_the_way', 'arrived', 'in_progress'].includes(selectedJob.status) && styles.timelineDotCompleted,
                          selectedJob.status === 'accepted' && styles.timelineDotPending
                        ]}>
                          {['on_the_way', 'arrived', 'in_progress'].includes(selectedJob.status) && (
                            <Ionicons name="checkmark" size={12} color={COLORS.background.primary} />
                          )}
                        </View>
                        <View style={styles.timelineLine} />
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>On the way</Text>
                        <Text style={styles.timelineTime}>
                          {selectedJob.on_the_way_at 
                            ? formatLocalTime(selectedJob.on_the_way_at)
                            : ['on_the_way', 'arrived', 'in_progress'].includes(selectedJob.status) ? 'Heading to location' : 'Pending'
                          }
                        </Text>
                      </View>
                    </View>

                    {/* Arrived */}
                    <View style={styles.timelineItem}>
                      <View style={styles.timelineIndicator}>
                        <View style={[
                          styles.timelineDot,
                          ['arrived', 'in_progress'].includes(selectedJob.status) && styles.timelineDotCompleted,
                          ['accepted', 'on_the_way'].includes(selectedJob.status) && styles.timelineDotPending
                        ]}>
                          {['arrived', 'in_progress'].includes(selectedJob.status) && (
                            <Ionicons name="checkmark" size={12} color={COLORS.background.primary} />
                          )}
                        </View>
                        <View style={styles.timelineLine} />
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>Arrived</Text>
                        <Text style={styles.timelineTime}>
                          {selectedJob.arrived_at
                            ? formatLocalTime(selectedJob.arrived_at)
                            : ['arrived', 'in_progress'].includes(selectedJob.status) ? 'At customer location' : 'Pending'
                          }
                        </Text>
                      </View>
                    </View>

                    {/* In Progress */}
                    <View style={styles.timelineItem}>
                      <View style={styles.timelineIndicator}>
                        <View style={[
                          styles.timelineDot,
                          selectedJob.status === 'in_progress' && styles.timelineDotActive,
                          !['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(selectedJob.status) && styles.timelineDotPending
                        ]}>
                          {selectedJob.status === 'in_progress' && (
                            <View style={styles.timelineDotPulse} />
                          )}
                        </View>
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineLabel}>Service in Progress</Text>
                        <Text style={styles.timelineTime}>
                          {selectedJob.started_at
                            ? `${formatLocalTime(selectedJob.started_at)} - Now`
                            : selectedJob.status === 'in_progress' ? 'Currently servicing' : 'Not started'
                          }
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Customer Info */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Customer</Text>
                <View style={styles.customerInfo}>
                  <View style={styles.customerAvatar}>
                    {selectedJob.customer?.avatar ? (
                      <Image 
                        source={{ 
                          uri: selectedJob.customer.avatar,
                          cache: 'force-cache'
                        }} 
                        style={styles.customerAvatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="person" size={32} color={COLORS.primary} />
                    )}
                  </View>
                  <View style={styles.customerDetails}>
                    <Text style={styles.customerName}>{selectedJob.customer?.name}</Text>
                  </View>
                </View>
                
                {/* Contact Actions - Chat Only (show after accepting) */}
                {['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(selectedJob.status) && (
                  <View style={styles.contactActions}>
                    <TouchableOpacity 
                      style={[styles.contactActionButton, { flex: 1 }]}
                      onPress={() => handleChatCustomer(selectedJob.id)}
                    >
                      <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.info} />
                      <Text style={styles.contactActionText}>Chat with Customer</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Services */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Services</Text>
                {selectedJob.services?.map((service, index) => (
                  <View key={index} style={styles.serviceItem}>
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.serviceDuration}>{service.duration} min</Text>
                    </View>
                    <Text style={styles.servicePrice}>RM {service.price}</Text>
                  </View>
                ))}
              </View>

              {/* Date & Time */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Schedule</Text>
                <View style={styles.scheduleInfo}>
                  {/* PRODUCTION: Use scheduled_datetime for timezone-aware display */}
                  {selectedJob.scheduled_datetime ? (
                    <>
                      <View style={styles.scheduleRow}>
                        <Ionicons name="calendar" size={20} color={COLORS.text.secondary} />
                        <Text style={styles.scheduleText}>{formatLocalDate(selectedJob.scheduled_datetime, 'long')}</Text>
                      </View>
                      <View style={styles.scheduleRow}>
                        <Ionicons name="time" size={20} color={COLORS.text.secondary} />
                        <Text style={styles.scheduleText}>{formatLocalTime(selectedJob.scheduled_datetime)}</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.scheduleRow}>
                        <Ionicons name="calendar" size={20} color={COLORS.text.secondary} />
                        <Text style={styles.scheduleText}>{selectedJob.scheduledDate}</Text>
                      </View>
                      <View style={styles.scheduleRow}>
                        <Ionicons name="time" size={20} color={COLORS.text.secondary} />
                        <Text style={styles.scheduleText}>{formatTime(selectedJob.scheduledTime)}</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* Location */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Location</Text>
                <View style={styles.locationInfo}>
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                  <Text style={styles.locationText}>{selectedJob.address?.fullAddress}</Text>
                </View>
                {selectedJob.address?.notes && (
                  <Text style={styles.locationNotes}>Note: {selectedJob.address.notes}</Text>
                )}
                
                {/* Distance Info */}
                {selectedJob.distance && (
                  <View style={styles.distanceInfo}>
                    <Ionicons name="navigate" size={16} color={COLORS.text.secondary} />
                    <Text style={styles.distanceText}>{Number(selectedJob.distance).toFixed(1)} km away</Text>
                  </View>
                )}
                
                {/* Navigation Button - Only show after payment confirmed */}
                {['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(selectedJob.status) && 
                 // Don't show if waiting for payment
                 !(selectedJob.status === 'accepted' && 
                   ['card', 'curlec_card', 'curlec_fpx'].includes(selectedJob.payment_method) && 
                   selectedJob.payment_status !== 'authorized') && (
                  <TouchableOpacity 
                    style={styles.directionsButton}
                    onPress={() => handleGetDirections(
                      selectedJob.address?.fullAddress || '',
                      selectedJob.address?.lat,
                      selectedJob.address?.lng
                    )}
                  >
                    <Ionicons name="navigate" size={20} color={COLORS.background.primary} />
                    <Text style={styles.directionsButtonText}>Get Directions</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Notes */}
              {(selectedJob.customer_notes || selectedJob.notes) && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Customer Notes</Text>
                  <Text style={styles.notesText}>{selectedJob.customer_notes || selectedJob.notes}</Text>
                </View>
              )}

              {/* Earnings Breakdown */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Your Earnings</Text>
                <View style={styles.priceBreakdown}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Services</Text>
                    <Text style={styles.priceValue}>
                      RM {selectedJob.services?.reduce((sum, s) => sum + s.price, 0).toFixed(2)}
                    </Text>
                  </View>
                  {selectedJob.travelCost && selectedJob.travelCost > 0 && (
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>
                        Travel{selectedJob.distance ? ` (${Number(selectedJob.distance).toFixed(1)} km)` : ''}
                      </Text>
                      <Text style={styles.priceValue}>RM {selectedJob.travelCost.toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Subtotal</Text>
                    <Text style={styles.priceValue}>
                      RM {((selectedJob.services?.reduce((sum, s) => sum + s.price, 0) || 0) + (selectedJob.travelCost || 0)).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={[styles.priceLabel, { color: '#FF6B6B' }]}>Platform Commission (15% on services)</Text>
                    <Text style={[styles.priceValue, { color: '#FF6B6B' }]}>- RM {((selectedJob.services?.reduce((sum, s) => sum + s.price, 0) || 0) * 0.15).toFixed(2)}</Text>
                  </View>
                  <View style={styles.priceDivider} />
                  <View style={styles.priceRow}>
                    <Text style={styles.priceTotalLabel}>You'll Earn</Text>
                    <Text style={[styles.priceTotalValue, { color: Colors.primary }]}>
                      RM {(((selectedJob.services?.reduce((sum, s) => sum + s.price, 0) || 0) * 0.85) + (selectedJob.travelCost || 0)).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Action Buttons */}
            {!['completed', 'cancelled', 'rejected', 'expired'].includes(selectedJob.status) && (
              <View style={styles.modalActions}>
                {selectedJob.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRejectJob(selectedJob)}
                    >
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptJob(selectedJob)}
                    >
                      <Text style={styles.acceptButtonText}>Accept Job</Text>
                    </TouchableOpacity>
                  </>
                )}
                {selectedJob.status === 'accepted' && (
                  <>
                    {['card', 'curlec_card', 'curlec_fpx'].includes(selectedJob.payment_method) && selectedJob.payment_status !== 'authorized' ? (
                      <View style={styles.waitingPaymentContainer}>
                        <View style={styles.waitingPaymentIcon}>
                          <Ionicons name="time-outline" size={24} color={COLORS.warning} />
                        </View>
                        <View style={styles.waitingPaymentContent}>
                          <Text style={styles.waitingPaymentTitle}>Waiting for customer payment...</Text>
                          <Text style={styles.waitingPaymentText}>
                            The customer will complete payment authorization shortly. You can proceed once payment is confirmed.
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => handleOnTheWay(selectedJob)}
                      >
                        <Ionicons name="navigate" size={20} color={COLORS.background.primary} />
                        <Text style={styles.primaryButtonText}>I'm on the way</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
                {selectedJob.status === 'on_the_way' && (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleArrived(selectedJob)}
                  >
                    <Ionicons name="location" size={20} color={COLORS.background.primary} />
                    <Text style={styles.primaryButtonText}>I've Arrived</Text>
                  </TouchableOpacity>
                )}
                {selectedJob.status === 'arrived' && (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleStartJob(selectedJob)}
                  >
                    <Ionicons name="play-circle" size={20} color={COLORS.background.primary} />
                    <Text style={styles.primaryButtonText}>Start Service</Text>
                  </TouchableOpacity>
                )}
                {selectedJob.status === 'in_progress' && (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => handleCompleteJob(selectedJob)}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.background.primary} />
                    <Text style={styles.primaryButtonText}>Complete Job</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {/* Loading Overlay - Prevents flash during status updates */}
            {isUpdatingStatus && (
              <View style={styles.loadingOverlay}>
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Updating...</Text>
                </View>
              </View>
            )}
          </SafeAreaView>
        )}
      </Modal>

      {/* Completion Modal */}
      <Modal
        visible={showCompletionModal && selectedJob !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        {showCompletionModal && selectedJob && (
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCompletionModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.text.primary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Complete Job</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView 
              style={styles.modalContent} 
              showsVerticalScrollIndicator={false}
            >
            {/* Completion Banner */}
            <View style={styles.completionBanner}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
              <Text style={styles.completionBannerTitle}>Almost Done!</Text>
              <Text style={styles.completionBannerText}>
                Complete the checklist and add photos before finishing
              </Text>
            </View>

            {/* Service Checklist */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Service Checklist</Text>
              <Text style={styles.sectionSubtitle}>Verify all items before completing</Text>
              {completionChecklist.map((item) => (
                <TouchableOpacity
                  key={`checklist-${item.id}`}
                  style={styles.checklistItem}
                  onPress={() => toggleChecklistItem(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkbox,
                    item.checked && styles.checkboxChecked
                  ]}>
                    {item.checked && (
                      <Ionicons name="checkmark" size={18} color={COLORS.background.primary} />
                    )}
                  </View>
                  <Text style={[
                    styles.checklistLabel,
                    item.checked && styles.checklistLabelChecked
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Before Photos - Read-only if evidence exists */}
            <View style={styles.detailSection}>
              <View style={styles.photoHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailSectionTitle}>Before Photos</Text>
                  <Text style={styles.sectionSubtitle}>
                    {beforePhotos.length > 0 
                      ? '📸 Taken at service start' 
                      : 'Required - taken when starting service'}
                  </Text>
                </View>
                {beforePhotos.length > 0 && (
                  <View style={styles.evidenceBadge}>
                    <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
                    <Text style={styles.evidenceBadgeText}>Evidence</Text>
                  </View>
                )}
              </View>
              {beforePhotos.length > 0 ? (
                <View style={styles.photosGrid}>
                  {beforePhotos.map((uri, index) => (
                    <View key={`before-${index}-${uri.substring(0, 10)}`} style={styles.photoContainer}>
                      <Image source={{ uri }} style={styles.photo} />
                      <View style={styles.photoLockBadge}>
                        <Ionicons name="lock-closed" size={16} color={COLORS.background.primary} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noPhotoContainer}>
                  <Ionicons name="alert-circle-outline" size={32} color={COLORS.error} />
                  <Text style={styles.noPhotoText}>Before photo is required and must be taken when starting service</Text>
                </View>
              )}
            </View>

            {/* After Photos */}
            <View style={styles.detailSection}>
              <View style={styles.photoHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailSectionTitle}>After Photos</Text>
                  <Text style={styles.sectionSubtitle}>Take at least 1 photo 📸</Text>
                </View>
                {afterPhotos.length === 0 && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredBadgeText}>Required</Text>
                  </View>
                )}
              </View>
              <View style={styles.photosGrid}>
                {afterPhotos.map((uri, index) => (
                  <View key={`after-${index}-${uri.substring(0, 10)}`} style={styles.photoContainer}>
                    <Image source={{ uri }} style={styles.photo} />
                    <TouchableOpacity
                      style={styles.photoRemoveButton}
                      onPress={() => removePhoto('after', index)}
                    >
                      <Ionicons name="close-circle" size={24} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                {afterPhotos.length < 3 && (
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={() => showPhotoOptions('after')}
                  >
                    <Ionicons name="camera" size={32} color={COLORS.text.tertiary} />
                    <Text style={styles.addPhotoText}>{afterPhotos.length === 0 ? 'Take Photo' : 'Add More'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Job Summary - Customer Info */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Job Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Customer</Text>
                <Text style={styles.summaryValue}>{selectedJob?.customer?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Services</Text>
                <Text style={styles.summaryValue}>
                  {selectedJob?.services?.map(s => s.name).join(', ')}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>
                  {selectedJob?.services?.reduce((sum, s) => sum + (s.duration || 0), 0) || selectedJob?.duration} min
                </Text>
              </View>
            </View>

            {/* Your Earnings - Grab Standard */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Your Earnings</Text>
              <View style={styles.earningsBreakdown}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Services Total</Text>
                  <Text style={styles.priceValue}>
                    RM {(selectedJob?.services?.reduce((sum, s) => sum + s.price, 0) || 0).toFixed(2)}
                  </Text>
                </View>
                {selectedJob?.travelCost > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>
                      Travel Cost ({selectedJob?.distance ? `${Number(selectedJob.distance).toFixed(1)} km` : 'N/A'})
                    </Text>
                    <Text style={styles.priceValue}>RM {selectedJob.travelCost.toFixed(2)}</Text>
                  </View>
                )}
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Total</Text>
                  <Text style={styles.priceValue}>
                    RM {((selectedJob?.services?.reduce((sum, s) => sum + s.price, 0) || 0) + (selectedJob?.travelCost || 0)).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: '#FF6B6B' }]}>Platform Commission (15% on services)</Text>
                  <Text style={[styles.priceValue, { color: '#FF6B6B' }]}>- RM {((selectedJob?.services?.reduce((sum, s) => sum + s.price, 0) || 0) * 0.15).toFixed(2)}</Text>
                </View>
                <View style={styles.priceDivider} />
                <View style={styles.priceRow}>
                  <Text style={styles.priceTotalLabel}>You'll Earn</Text>
                  <Text style={[styles.priceTotalValue, { color: Colors.primary }]}>
                    RM {(((selectedJob?.services?.reduce((sum, s) => sum + s.price, 0) || 0) * 0.85) + (selectedJob?.travelCost || 0)).toFixed(2)}
                  </Text>
                </View>
              </View>
              {selectedJob?.payment_method === 'cash' && (
                <View style={styles.cashNotice}>
                  <Ionicons name="cash-outline" size={20} color={Colors.warning} />
                  <Text style={styles.cashNoticeText}>
                    💵 Collect RM {selectedJob?.totalPrice} cash from customer
                  </Text>
                </View>
              )}
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Complete Button */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.completeJobButton,
                (!completionChecklist.every(item => item.checked) || isSubmitting) && styles.completeJobButtonDisabled
              ]}
              onPress={handleFinalizeCompletion}
              disabled={isSubmitting || !completionChecklist.every(item => item.checked)}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color={COLORS.background.primary} />
                  <Text style={styles.completeJobButtonText}>
                    {afterPhotos.length > 0 ? 'Uploading Photos...' : 'Submitting...'}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.background.primary} />
                  <Text style={styles.completeJobButtonText}>Complete & Submit</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
  },
  filterTabs: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filterTabsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    shadowOpacity: 0.15,
  },
  filterTabText: {
    ...TYPOGRAPHY.body.regular,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  filterTabTextActive: {
    color: COLORS.text.inverse,
  },
  filterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: COLORS.background.tertiary,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  filterBadgeTextActive: {
    color: COLORS.text.inverse,
  },
  jobsList: {
    flex: 1,
  },
  jobsListContent: {
    paddingHorizontal: 20,
  },
  jobCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  jobStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  jobCustomerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  jobDate: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  jobStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  jobStatusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  jobCardBody: {
    marginBottom: 12,
    gap: 8,
  },
  jobInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobInfoText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    flex: 1,
  },
  jobCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.tertiary,
  },
  jobPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  jobTotalPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.tertiary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  modalTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
  },
  modalContent: {
    flex: 1,
  },
  bookingInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
    borderRadius: 12,
  },
  bookingNumberContainer: {
    flex: 1,
  },
  bookingNumberLabel: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  bookingNumber: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  paymentMethodBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.background.secondary,
  },
  paymentMethodTextLarge: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    gap: 12,
  },
  statusBannerText: {
    ...TYPOGRAPHY.body.regular,
    fontWeight: '600',
    flex: 1,
  },
  detailSection: {
    backgroundColor: COLORS.background.primary,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
  },
  detailSectionTitle: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  customerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  customerContact: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  contactActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.tertiary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  contactActionText: {
    ...TYPOGRAPHY.body.regular,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.tertiary,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...TYPOGRAPHY.body.regular,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  serviceDuration: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  servicePrice: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  scheduleInfo: {
    gap: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
  },
  locationInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  locationText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
    flex: 1,
  },
  locationNotes: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.background.tertiary,
  },
  distanceText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  directionsButtonText: {
    ...TYPOGRAPHY.body.regular,
    fontWeight: '700',
    color: COLORS.background.primary,
  },
  notesText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
  priceBreakdown: {
    gap: 12,
  },
  earningsBreakdown: {
    gap: 12,
  },
  cashNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  cashNoticeText: {
    ...TYPOGRAPHY.body.regular,
    color: Colors.warning,
    fontWeight: '600',
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
  },
  priceValue: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
  },
  priceDivider: {
    height: 1,
    backgroundColor: COLORS.border.light,
    marginVertical: 4,
  },
  priceTotalLabel: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  priceTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: COLORS.background.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    gap: 12,
  },
  waitingPaymentContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.warningLight || '#FFF4E5',
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  waitingPaymentIcon: {
    marginTop: 2,
  },
  waitingPaymentContent: {
    flex: 1,
  },
  waitingPaymentTitle: {
    ...TYPOGRAPHY.body.regular,
    fontWeight: '700',
    color: COLORS.warning,
    marginBottom: 4,
  },
  waitingPaymentText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  acceptButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.inverse,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.inverse,
  },
  // Timeline Styles
  timelineSection: {
    backgroundColor: COLORS.background.primary,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
  },
  timelineSectionTitle: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border.light,
  },
  timelineDotCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timelineDotActive: {
    backgroundColor: COLORS.info,
    borderColor: COLORS.info,
  },
  timelineDotPending: {
    backgroundColor: COLORS.background.primary,
    borderColor: COLORS.border.medium,
  },
  timelineDotPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.background.primary,
  },
  timelineLine: {
    width: 2,
    height: 32,
    backgroundColor: COLORS.border.light,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineLabel: {
    ...TYPOGRAPHY.body.regular,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  timelineTime: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
  },
  // Completion Modal Styles
  completionBanner: {
    alignItems: 'center',
    padding: 24,
    margin: 20,
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
  },
  completionBannerTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    marginTop: 12,
    marginBottom: 8,
  },
  completionBannerText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    marginTop: -8,
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border.medium,
    backgroundColor: COLORS.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checklistLabel: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
    flex: 1,
  },
  checklistLabelChecked: {
    color: COLORS.text.secondary,
    textDecorationLine: 'line-through',
  },
  photoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  requiredBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  requiredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  evidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  evidenceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.background.tertiary,
  },
  photoRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  photoLockBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 4,
  },
  noPhotoContainer: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  noPhotoText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border.medium,
    borderStyle: 'dashed',
    backgroundColor: COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.secondary,
    flex: 1,
  },
  summaryValue: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border.light,
    marginVertical: 8,
  },
  summaryTotalLabel: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  summaryTotalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  completeJobButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeJobButtonDisabled: {
    backgroundColor: COLORS.text.tertiary,
    opacity: 0.5,
  },
  completeJobButtonText: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.background.primary,
  },
  // Analytics Styles
  analyticsSection: {
    marginBottom: 20,
  },
  analyticsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  analyticsSectionTitle: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    fontWeight: '700',
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  analyticsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  analyticsLabel: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  analyticsValue: {
    ...TYPOGRAPHY.heading.h3,
    color: COLORS.text.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  analyticsSubtext: {
    ...TYPOGRAPHY.body.small,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  jobHistoryTitle: {
    ...TYPOGRAPHY.body.large,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginTop: 8,
    marginBottom: 12,
  },
  // Payment Method Badge Styles
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    backgroundColor: Colors.successLight,
  },
  paymentMethodCash: {
    backgroundColor: Colors.warningLight,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: 0.5,
  },
  paymentInstructionText: {
    ...TYPOGRAPHY.body.small,
    color: Colors.warning,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  // Loading Overlay Styles (prevents flash during status updates)
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  loadingContainer: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    ...TYPOGRAPHY.body.regular,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
});
