import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, StatusBar, Dimensions, Animated, Easing, Platform, AppState, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router, useFocusEffect } from 'expo-router';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { COLORS, TYPOGRAPHY } from '@/shared/constants';
import { formatTime, formatLocalTime } from '@/utils/format';
import { extractDateFromISO } from '@mari-gunting/shared/utils/format';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@mari-gunting/shared/services/bookingService';
import { Booking } from '@/types';
import { verificationService, VerificationInfo } from '@mari-gunting/shared/services/verificationService';
import { supabase } from '@mari-gunting/shared/config/supabase';
import VerificationProgressWidget from '@/components/VerificationProgressWidget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { locationTrackingService } from '@/services/locationTrackingService';
import { heartbeatService } from '@/services/heartbeatService';
import { connectionMonitor } from '@mari-gunting/shared/services/connectionMonitor';
import * as Location from 'expo-location';
import { getPartnerReviews, getReviewStats } from '@mari-gunting/shared/services/reviewsService';
import { Colors, theme } from '@mari-gunting/shared/theme';
import { serviceService } from '@mari-gunting/shared/services/serviceService';

// Responsive helper
const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

// Format currency helper
const formatCurrency = (amount: number): string => {
  return amount.toFixed(2);
};

// Verification Banner Component
const VerificationBanner = ({ verificationInfo }: { verificationInfo: VerificationInfo }) => {
  const getBannerConfig = () => {
    switch (verificationInfo.status) {
      case 'pending':
        return {
          bgColor: '#FFF3CD',
          borderColor: '#FFB800',
          icon: 'time-outline' as const,
          iconColor: '#FFB800',
          title: 'Verification Pending',
          subtitle: verificationInfo.message,
        };
      case 'rejected':
        return {
          bgColor: '#FFE8E8',
          borderColor: '#FF3B30',
          icon: 'close-circle-outline' as const,
          iconColor: '#FF3B30',
          title: 'Verification Failed',
          subtitle: verificationInfo.message,
        };
      case 'unverified':
      default:
        return {
          bgColor: '#E8F4FF',
          borderColor: Colors.info,
          icon: 'alert-circle-outline' as const,
          iconColor: Colors.info,
          title: 'Complete Your Profile',
          subtitle: verificationInfo.message,
        };
    }
  };

  const config = getBannerConfig();

  return (
    <View style={styles.verificationBannerContainer}>
      <View style={[styles.verificationBanner, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
        <View style={[styles.verificationIcon, { backgroundColor: config.iconColor + '20' }]}>
          <Ionicons name={config.icon} size={24} color={config.iconColor} />
        </View>
        <View style={styles.verificationContent}>
          <Text style={styles.verificationTitle}>{config.title}</Text>
          <Text style={styles.verificationSubtitle}>{config.subtitle}</Text>
          {!verificationInfo.canAcceptBookings && (
            <Text style={styles.verificationWarning}>⚠️ You cannot accept bookings yet</Text>
          )}
        </View>
      </View>
    </View>
  );
};

// Animated Toast
const Toast = ({ message, type = 'success', visible, onHide }: { message: string; type?: 'success' | 'error'; visible: boolean; onHide: () => void }) => {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(translateY, { toValue: 0, friction: 8, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(translateY, { toValue: -100, duration: 200, useNativeDriver: true }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { backgroundColor: type === 'success' ? COLORS.primary : COLORS.error, transform: [{ translateY }] }]}>
      <Ionicons name={type === 'success' ? 'checkmark-circle' : 'close-circle'} size={22} color="#FFF" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

export default function PartnerDashboardScreen() {
  const currentUser = useStore((state) => state.currentUser);
  const queryClient = useQueryClient();
  const [barberId, setBarberId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false); // Default to offline
  const [refreshing, setRefreshing] = useState(false);
  const [dailyGoal] = useState(200);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({ message: '', type: 'success', visible: false });
  const [verificationInfo, setVerificationInfo] = useState<VerificationInfo | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(true);
  const [accountType, setAccountType] = useState<'freelance' | 'barbershop'>('freelance');
  const [realRating, setRealRating] = useState<number>(0);
  const [backgroundTime, setBackgroundTime] = useState<number | null>(null);
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const toggleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);
  const isOnlineRef = useRef(isOnline);
  const backgroundTimeRef = useRef<number | null>(null);
  const permissionCheckedRef = useRef(false);

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Timer state for countdown on pending orders
  const [currentTime, setCurrentTime] = useState(Date.now());

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

  // Update timer every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch real rating from reviews (on mount and account type change)
  useEffect(() => {
    const loadRating = async () => {
      if (!currentUser?.id) return;
      try {
        console.log('📊 [Dashboard] Loading rating for:', { userId: currentUser.id, accountType });
        const reviews = await getPartnerReviews(currentUser.id, accountType);
        console.log('📊 [Dashboard] Reviews fetched:', reviews.length);
        const stats = getReviewStats(reviews);
        console.log('📊 [Dashboard] Rating calculated:', stats.avgRating);
        setRealRating(stats.avgRating);
      } catch (error) {
        console.error('❌ [Dashboard] Failed to load rating:', error);
      }
    };
    loadRating();
  }, [currentUser?.id, accountType]);

  // Refresh rating when tab is focused (when navigating back from Reviews)
  useFocusEffect(
    useCallback(() => {
      const refreshRating = async () => {
        if (!currentUser?.id) return;
        try {
          const reviews = await getPartnerReviews(currentUser.id, accountType);
          const stats = getReviewStats(reviews);
          setRealRating(stats.avgRating);
        } catch (error) {
          console.error('Failed to refresh rating:', error);
        }
      };
      refreshRating();
    }, [currentUser?.id, accountType])
  );

  // REAL SUPABASE QUERY - Fetch barber bookings
  const { data: bookingsResponse, isLoading: loadingBookings, error: bookingsError } = useQuery({
    queryKey: ['barber-bookings', barberId],
    queryFn: async () => {
      const result = await bookingService.getBarberBookings(barberId || '');
      return result;
    },
    enabled: !!barberId,
    staleTime: 5 * 60 * 1000, // 5 min - rely on realtime for updates
    // No polling - realtime handles updates instantly
  });

  const partnerBookings = bookingsResponse?.data || [];

  // Real-time subscription for ALL booking changes (INSERT + UPDATE + DELETE)
  useEffect(() => {
    if (!barberId) return;

    console.log('🔊 Setting up realtime subscription for barber:', barberId);

    const channel = supabase
      .channel('dashboard-bookings')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bookings',
          filter: `barber_id=eq.${barberId}`,
        },
        (payload) => {
          console.log('🔔 Booking changed:', payload.eventType, payload);
          
          // Refresh bookings data
          queryClient.invalidateQueries({ queryKey: ['barber-bookings'] });
          
          // Show toast for new bookings only
          if (payload.eventType === 'INSERT') {
            setToast({ 
              message: '🔔 New booking request!', 
              type: 'success', 
              visible: true 
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barberId, queryClient]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Load account type from database (single source of truth)
    const loadAccountType = async () => {
      if (!currentUser?.id) return;
      
      try {
        // Get user role from database (check roles array for multi-role support)
        const { data, error } = await supabase
          .from('profiles')
          .select('role, roles')
          .eq('id', currentUser.id)
          .single();
        
        if (error) {
          console.error('Error loading account type from database:', error);
          return;
        }
        
        // Map database role to account type (check roles array first)
        const userRoles = data.roles || [data.role];
        const accountType = userRoles.includes('barbershop_owner') ? 'barbershop' : 'freelance';
        setAccountType(accountType);
        
        // Cache in AsyncStorage for faster subsequent access
        await AsyncStorage.setItem('partnerAccountType', accountType);
        
        console.log('✅ Account type loaded from database:', { role: data.role, accountType });
      } catch (error) {
        console.error('Exception loading account type:', error);
      }
    };

    loadAccountType();
    // Load verification status
    loadVerificationStatus();
    // Load initial online status
    loadOnlineStatus();
    // Note: checkLocationPermission() is called separately after accountType loads
    
    // Cleanup timeout on unmount
    return () => {
      if (toggleTimeoutRef.current) {
        clearTimeout(toggleTimeoutRef.current);
      }
    };
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    backgroundTimeRef.current = backgroundTime;
  }, [backgroundTime]);

  // Check location permission AFTER account type is loaded
  useEffect(() => {
    if (accountType) {
      checkLocationPermission();
    }
  }, [accountType]); // Only run when accountType changes

  // AppState listener: Handle app backgrounding and force quit
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      console.log('📱 AppState changed:', appState.current, '→', nextAppState);
      
      // App went to background
      if (appState.current.match(/active/) && nextAppState === 'background') {
        const now = Date.now();
        console.log('⏸️  App backgrounded at:', new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' }));
        backgroundTimeRef.current = now;
        setBackgroundTime(now);
        // Keep online - barber can still receive notifications
      }
      
      // App came back to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('▶️  App resumed at:', new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' }));
        
        // Check how long app was backgrounded - use refs to avoid stale closure
        const bgTime = backgroundTimeRef.current;
        const online = isOnlineRef.current;
        
        console.log('📊 Idle check:', { bgTime, online, hasBgTime: !!bgTime });
        
        // CRITICAL: Check if location permission was changed while app was backgrounded (freelance only)
        if (online && accountType === 'freelance') {
          try {
            const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
            
            if (bgStatus !== 'granted') {
              console.warn('⚠️ Background permission was revoked - forcing offline');
              
              // Force offline immediately
              setIsOnline(false);
              
              // Update database
              if (currentUser?.id) {
                await supabase
                  .from('profiles')
                  .update({ is_online: false })
                  .eq('id', currentUser.id);
              }
              
              // Stop all tracking services
              await locationTrackingService.stopTracking();
              await heartbeatService.stopHeartbeat();
              await connectionMonitor.stopMonitoring();
              
              // Show alert
              Alert.alert(
                'Location Permission Changed',
                'Your location permission was changed to "While Using App". You have been taken offline.\n\nTo go online, please enable "Always Allow" in Settings.',
                [
                  { text: 'OK', style: 'cancel' },
                  { 
                    text: 'Open Settings', 
                    onPress: () => Linking.openSettings() 
                  },
                ]
              );
              
              // Skip idle check if we forced offline
              backgroundTimeRef.current = null;
              setBackgroundTime(null);
              appState.current = nextAppState;
              return;
            }
          } catch (error) {
            console.error('Error checking permission on resume:', error);
          }
        }
        
        // Idle warning and auto-offline check (if still online)
        if (bgTime && online) {
          const idleMinutes = (Date.now() - bgTime) / 1000 / 60;
          console.log(`⏱️  Was idle for ${idleMinutes.toFixed(1)} minutes`);
          
          // CRITICAL: Auto-offline if idle for more than 30 minutes
          if (idleMinutes > 30) {
            console.log('🔴 Auto-offline: idle > 30 min');
            
            // Force offline immediately
            setIsOnline(false);
            
            // Update database
            if (currentUser?.id) {
              await supabase
                .from('profiles')
                .update({ is_online: false })
                .eq('id', currentUser.id);
            }
            
            // Stop all tracking services
            await locationTrackingService.stopTracking();
            await heartbeatService.stopHeartbeat();
            await connectionMonitor.stopMonitoring();
            
            // Show alert
            Alert.alert(
              'Taken Offline',
              'You were taken offline due to 30+ minutes of inactivity.\n\nToggle online again when ready.',
              [{ text: 'OK' }]
            );
          }
          // Show warning if idle for more than 15 minutes (but less than 30)
          else if (idleMinutes > 15) {
            console.log('⚠️ Showing idle warning (idle > 15 min)');
            setShowIdleWarning(true);
          }
        }
        
        backgroundTimeRef.current = null;
        setBackgroundTime(null);
      }
      
      appState.current = nextAppState;
    });
    
    return () => {
      subscription.remove();
    };
  }, []); // Empty deps - uses refs instead

  const loadVerificationStatus = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoadingVerification(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const info = await verificationService.getVerificationStatus(user.id);
      setVerificationInfo(info);
    } catch (error) {
      console.error('Failed to load verification status:', error);
    } finally {
      setLoadingVerification(false);
    }
  };

  const loadOnlineStatus = async () => {
    if (!currentUser?.id) return;
    
    try {
      // ALWAYS start offline when app opens (handles force close scenario)
      // User must explicitly toggle online
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_online: false })
        .eq('id', currentUser.id);
      
      if (updateError) {
        console.error('Error setting offline on startup:', updateError);
      } else {
        console.log('✅ Set offline on app startup (force close protection)');
      }
      
      // CRITICAL: Force stop all tracking services on startup (handles force close blue arrow)
      // This stops lingering background location tasks that may still be running
      console.log('🛑 Force stopping all tracking services on startup...');
      await locationTrackingService.stopTracking();
      await heartbeatService.stopHeartbeat();
      await connectionMonitor.stopMonitoring();
      console.log('✅ All tracking services stopped');
      
      // Keep local state as offline
      setIsOnline(false);
    } catch (error) {
      console.error('Failed to load online status:', error);
    }
  };

  // Check location permission for returning users (after reinstall)
  const checkLocationPermission = async () => {
    // Only check once per app session
    if (permissionCheckedRef.current) return;
    permissionCheckedRef.current = true;

    // Only check for freelance barbers
    if (accountType !== 'freelance') {
      console.log('ℹ️ Barbershop account - skipping location permission check');
      return;
    }

    try {
      // Check if permission was already granted
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();

      console.log('📍 Permission status check:', { foregroundStatus, backgroundStatus });

      // If both permissions granted, no need to ask
      if (foregroundStatus === 'granted' && backgroundStatus === 'granted') {
        console.log('✅ Location permissions already granted');
        return;
      }

      // Permission missing - request directly (iOS will show its own popups)
      console.log('⚠️ Location permission missing - requesting now');
      await requestLocationPermission();
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  // Request location permission (for returning users)
  const requestLocationPermission = async () => {
    try {
      console.log('📍 Requesting location permissions...');

      // Request foreground first
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.warn('⚠️ Foreground permission denied');
        return;
      }

      // Request background permission
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('⚠️ Background permission denied');
        return;
      }

      console.log('✅ Location permissions granted');
      setToast({ message: 'Location permission granted!', type: 'success', visible: true });
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Error', 'Failed to request location permission. Please try again.');
    }
  };

  const stats = useMemo(() => {
    if (!currentUser || !barberId)
      return {
        todayEarnings: 0,
        monthlyEarnings: 0,
        monthlyJobs: 0,
        completedToday: 0,
        totalCompleted: 0,
        pendingCount: 0,
        activeCount: 0,
        goalProgress: 0,
        avgRating: 0,
        acceptance: 95,
      };

    const now = new Date();
    // Get local date without UTC conversion
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`; // YYYY-MM-DD in local time
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Today's stats (use scheduled_datetime, fallback to scheduledDate)
    const todayBookings = partnerBookings.filter((b) => {
      const bookingDate = b.scheduled_datetime 
        ? extractDateFromISO(b.scheduled_datetime)
        : b.scheduledDate;
      return bookingDate === today;
    });
    const completed = todayBookings.filter((b) => b.status === 'completed');
    const todayEarnings = completed.reduce((sum, b) => {
      const servicesTotal = b.services?.reduce((s, svc) => s + svc.price, 0) || 0;
      const earnings = (servicesTotal * 0.85) + (b.travelCost || 0);
      return sum + earnings;
    }, 0);

    // This month's stats (actual earnings after commission)
    const monthlyCompleted = partnerBookings.filter((b) => {
      if (b.status !== 'completed') return false;
      const datetime = b.scheduled_datetime || `${b.scheduledDate}T00:00:00Z`;
      const bookingDate = new Date(datetime);
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
    });
    
    const monthlyEarnings = monthlyCompleted.reduce((sum, b) => {
      const servicesTotal = b.services?.reduce((s, svc) => s + svc.price, 0) || 0;
      const earnings = (servicesTotal * 0.85) + (b.travelCost || 0);
      return sum + earnings;
    }, 0);

    // Total completed jobs (all time)
    const totalCompleted = partnerBookings.filter((b) => b.status === 'completed').length;

    const activeCount = partnerBookings.filter((b) => ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(b.status)).length;
    const pendingCount = partnerBookings.filter((b) => b.status === 'pending').length;

    // Calculate real acceptance rate (Grab standard)
    const acceptedCount = partnerBookings.filter((b) => 
      ['accepted', 'on_the_way', 'arrived', 'in_progress', 'completed'].includes(b.status)
    ).length;
    
    const rejectedCount = partnerBookings.filter((b) => b.status === 'rejected').length;
    const expiredCount = partnerBookings.filter((b) => b.status === 'expired').length;
    
    const totalRequests = acceptedCount + rejectedCount + expiredCount;
    const acceptanceRate = totalRequests > 0 
      ? Math.round((acceptedCount / totalRequests) * 100) 
      : 100; // Default 100% if no requests yet

    return {
      todayEarnings,
      monthlyEarnings,
      monthlyJobs: monthlyCompleted.length,
      completedToday: completed.length,
      totalCompleted,
      pendingCount,
      activeCount,
      goalProgress: Math.min((todayEarnings / dailyGoal) * 100, 100),
      avgRating: realRating || 0,
      acceptance: acceptanceRate,
    };
  }, [currentUser, barberId, partnerBookings, dailyGoal, realRating]);

  const nextJob = useMemo(() => {
    if (!currentUser || !barberId) return null;
    return (
      partnerBookings
        .filter((b) => ['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(b.status))
        .sort((a, b) => {
          const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
          const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
          return dateA.getTime() - dateB.getTime();
        })[0] || null
    );
  }, [currentUser, barberId, partnerBookings]);

  const pendingRequests = useMemo(() => {
    if (!currentUser || !barberId) return [];
    
    // Trust database status - no frontend time calculations needed
    // Database (via cron) and Customer app handle expiration
    return partnerBookings
      .filter((b) => b.status === 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);
  }, [currentUser, barberId, partnerBookings]);

  // Memoize completed today list
  const completedToday = useMemo(() => {
    if (!currentUser || !barberId) return [];
    return partnerBookings
      .filter((b) => b.status === 'completed')
      .slice(0, 3);
  }, [currentUser, barberId, partnerBookings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadVerificationStatus(),
      queryClient.invalidateQueries({ queryKey: ['barber-bookings'] }),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]);
    setRefreshing(false);
  };


  const toggleOnlineStatus = useCallback(async () => {
    if (!currentUser?.id || isTogglingStatus) return;
    
    // Clear any pending toggle (debounce)
    if (toggleTimeoutRef.current) {
      clearTimeout(toggleTimeoutRef.current);
    }
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    setIsTogglingStatus(true);
    const newStatus = !isOnline;
    
    // CRITICAL: Check if services are set up before going online
    if (newStatus) {
      try {
        const services = await serviceService.getMyServices(currentUser.id);
        
        if (services.length === 0) {
          console.warn('⚠️ No services found - blocking online toggle');
          
          Alert.alert(
            'Services Required',
            'You need to add at least one service with pricing before going online. Customers need to see what services you offer.',
            [
              { 
                text: 'Cancel', 
                style: 'cancel',
                onPress: () => setIsTogglingStatus(false),
              },
              { 
                text: 'Set Up Services', 
                onPress: () => {
                  setIsTogglingStatus(false);
                  router.push('/services');
                },
              },
            ]
          );
          return; // Don't proceed with going online
        }
        
        console.log('✅ Services validated - proceeding with online toggle');
      } catch (error) {
        console.error('Error checking services:', error);
        Alert.alert('Error', 'Failed to verify services. Please try again.');
        setIsTogglingStatus(false);
        return;
      }
    }
    
    // CRITICAL: Check background location permission before going online (freelance only)
    if (newStatus && accountType === 'freelance') {
      try {
        const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
        
        if (bgStatus !== 'granted') {
          console.warn('⚠️ Background location not granted - blocking online toggle');
          
          Alert.alert(
            'Background Location Required',
            'To go online, you need to enable "Always Allow" for location access. This lets customers see your location even when the app is minimized.\n\nPlease go to Settings and change location permission to "Always Allow".',
            [
              { 
                text: 'Cancel', 
                style: 'cancel',
                onPress: () => setIsTogglingStatus(false),
              },
              { 
                text: 'Open Settings', 
                onPress: () => {
                  Linking.openSettings();
                  setIsTogglingStatus(false);
                },
              },
            ]
          );
          return; // Don't proceed with going online
        }
        
        console.log('✅ Background location permission confirmed - proceeding');
      } catch (error) {
        console.error('Error checking background permission:', error);
        setIsTogglingStatus(false);
        return;
      }
    }
    
    try {
      // Update local state immediately for better UX
      setIsOnline(newStatus);
      
      // PRODUCTION: Start all tracking services (Grab/Foodpanda standard)
      if (newStatus) {
        // 1. Start WebSocket connection monitor (instant disconnect detection)
        await connectionMonitor.startMonitoring(currentUser.id);
        console.log('✅ Connection monitor started');
        
        // 2. Start heartbeat for barbershop partners (freelancers get it from location)
        if (accountType === 'barbershop') {
          await heartbeatService.startHeartbeat(currentUser.id);
          console.log('💓 Heartbeat started');
        }
        
        // 3. Start location tracking for freelance barbers (includes heartbeat)
        if (accountType === 'freelance') {
          try {
            await locationTrackingService.startTracking(currentUser.id);
            console.log('✅ Location tracking started (continuous + background)');
          } catch (locationError) {
            console.error('❌ Failed to start location tracking:', locationError);
            console.log('⚠️ Continuing with online toggle - location will retry automatically');
            // Don't block the online toggle if location fails
            // The retry logic in locationTrackingService will handle it
          }
        }
      } else {
        // PRODUCTION: Stop all tracking services
        // 1. Stop connection monitor
        await connectionMonitor.stopMonitoring();
        console.log('🛑 Connection monitor stopped');
        
        // 2. Stop heartbeat
        await heartbeatService.stopHeartbeat();
        console.log('🛑 Heartbeat stopped');
        
        // 3. Stop location tracking
        if (accountType === 'freelance') {
          await locationTrackingService.stopTracking();
          console.log('🛑 Location tracking stopped');
        }
      }
      
      // Use server-side function to update status with server time
      const { data, error } = await supabase.rpc('toggle_online_status', {
        p_user_id: currentUser.id,
        new_status: newStatus,
        account_type: accountType,
      });
      
      if (error) {
        console.error('Error toggling online status:', error);
        // Revert on error
        setIsOnline(!newStatus);
        // Stop tracking if we failed to go online
        if (newStatus && accountType === 'freelance') {
          locationTrackingService.stopTracking();
        }
        setToast({ message: 'Failed to update status', type: 'error', visible: true });
        return;
      }
      
      // Check result from server function
      if (data && data.length > 0) {
        const result = data[0];
        
        if (!result.success) {
          console.error('Server rejected status update:', result.message);
          setIsOnline(!newStatus);
          // Stop tracking if we failed to go online
          if (newStatus && accountType === 'freelance') {
            locationTrackingService.stopTracking();
          }
          setToast({ message: result.message || 'Failed to update status', type: 'error', visible: true });
          return;
        }
        
        // Success!
        setToast({ 
          message: result.message, 
          type: newStatus ? 'success' : 'error', 
          visible: true 
        });
      }
    } catch (error) {
      console.error('Exception toggling online status:', error);
      // Revert on error
      setIsOnline(!newStatus);
      // Stop tracking if we failed to go online
      if (newStatus && accountType === 'freelance') {
        locationTrackingService.stopTracking();
      }
      setToast({ message: 'Failed to update status', type: 'error', visible: true });
    } finally {
      // Re-enable toggle after a short delay (prevent rapid spam)
      toggleTimeoutRef.current = setTimeout(() => {
        setIsTogglingStatus(false);
      }, 1000);
    }
  }, [currentUser, isOnline, accountType, isTogglingStatus]);

  // Show idle warning when returning after 15+ minutes
  useEffect(() => {
    if (showIdleWarning) {
      Alert.alert(
        '⏱️  You\'ve Been Idle',
        'You\'ve been away for more than 15 minutes. Consider going offline if you\'re not actively working.',
        [
          {
            text: 'Stay Online',
            style: 'cancel',
            onPress: () => setShowIdleWarning(false),
          },
          {
            text: 'Go Offline',
            style: 'default',
            onPress: async () => {
              setShowIdleWarning(false);
              await toggleOnlineStatus();
            },
          },
        ]
      );
    }
  }, [showIdleWarning, toggleOnlineStatus]);

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast({ ...toast, visible: false })} />
      
      {/* Orange Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>Hi, {currentUser.full_name?.split(' ')[0] || 'Partner'}!</Text>
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, { backgroundColor: isOnline ? '#FFF' : '#FFD700' }]} />
                  <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.notifIcon}
                onPress={() => router.push('/(tabs)/jobs')}
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications" size={24} color="#FFF" />
                {stats.pendingCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{stats.pendingCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Earnings Card in Header */}
            <TouchableOpacity
              style={styles.earningsCard}
              activeOpacity={0.9}
              onPress={() => router.push('/(tabs)/earnings')}
            >
              <View style={styles.earningsLeft}>
                <Text style={styles.earningsLabel}>TODAY'S EARNINGS</Text>
                <Text style={styles.earningsValue}>RM {formatCurrency(stats.todayEarnings)}</Text>
                <Text style={styles.earningsSubtext}>{stats.completedToday} trips completed</Text>
              </View>
              <View style={styles.earningsRight}>
                <View style={styles.earningsIcon}>
                  <Ionicons name="wallet" size={28} color={COLORS.primary} />
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.3)" style={{ marginTop: 4 }} />
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Error Banner */}
        {bookingsError && (
          <View style={styles.errorBanner}>
            <View style={styles.errorIcon}>
              <Ionicons name="warning" size={24} color="#FF3B30" />
            </View>
            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>Failed to load bookings</Text>
              <Text style={styles.errorSubtitle}>Please check your connection</Text>
            </View>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => queryClient.invalidateQueries({ queryKey: ['barber-bookings'] })}
            >
              <Ionicons name="refresh" size={20} color={COLORS.primary} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Verification Progress Widget */}
        <VerificationProgressWidget />
        
        {/* Verification Status Banner (Old - can be removed later) */}
        {!loadingVerification && verificationInfo && verificationInfo.status !== 'verified' && verificationInfo.status !== 'pending' && (
          <VerificationBanner verificationInfo={verificationInfo} />
        )}

        {/* Online/Offline Toggle - Prominent */}
        <Animated.View style={[styles.toggleSection, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[styles.toggleButton, isOnline ? styles.toggleOnline : styles.toggleOffline, isTogglingStatus && styles.toggleDisabled]}
            onPress={toggleOnlineStatus}
            activeOpacity={0.8}
            disabled={isTogglingStatus}
          >
            <View style={styles.toggleContent}>
              <View style={styles.toggleLeft}>
                <View style={[styles.toggleDot, { backgroundColor: isOnline ? '#FFF' : '#999' }]} />
                <Text style={[styles.toggleText, { color: isOnline ? '#FFF' : '#666' }]}>
                  {isTogglingStatus ? 'Updating...' : (isOnline ? "You're Online" : "You're Offline")}
                </Text>
              </View>
              <View style={[styles.toggleSwitch, isOnline && styles.toggleSwitchActive]}>
                <View style={[styles.toggleThumb, isOnline && styles.toggleThumbActive]} />
              </View>
            </View>
            <Text style={[styles.toggleSubtext, { color: isOnline ? 'rgba(255,255,255,0.8)' : '#999' }]}>
              {isTogglingStatus 
                ? 'Please wait...' 
                : (isOnline ? 'Tap to go offline and stop receiving orders' : 'Tap to go online and start receiving orders')}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Active Order - Most urgent: customer waiting */}
        {nextJob && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Order</Text>
              <Text style={styles.sectionSubtitle}>
                {nextJob.status === 'accepted' && 'Accepted - Preparing'}
                {nextJob.status === 'on_the_way' && 'On the way'}
                {nextJob.status === 'arrived' && 'Arrived at location'}
                {nextJob.status === 'in_progress' && 'Service in progress'}
              </Text>
            </View>
            <TouchableOpacity style={styles.activeCard} activeOpacity={0.9}>
              <View style={styles.activeLeft}>
                <View style={styles.activePulse}>
                  <View style={styles.activeIcon}>
                    <Ionicons name="navigate" size={20} color="#FFF" />
                  </View>
                </View>
                <View>
                  <Text style={styles.activeName}>{nextJob.customer?.name}</Text>
                  <View style={styles.activeMeta}>
                    <Ionicons name="location" size={12} color="#999" />
                    <Text style={styles.activeMetaText}>
                      {nextJob.distance ? `${Number(nextJob.distance).toFixed(1)} km` : 'N/A'} • {nextJob.scheduled_datetime ? formatLocalTime(nextJob.scheduled_datetime) : formatTime(nextJob.scheduledTime)}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.navigateBtn}
                onPress={() => router.push({ pathname: '/(tabs)/jobs', params: { jobId: nextJob.id } })}
              >
                <Text style={styles.navigateBtnText}>Navigate</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        )}

        {/* New Orders - Show immediately after active order */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Orders ({pendingRequests.length})</Text>
              <Text style={styles.sectionSubtitle}>Tap to view details</Text>
            </View>

            {pendingRequests.map((job, idx) => (
              <TouchableOpacity
                key={job.id}
                activeOpacity={0.9}
                onPress={() => {
                  // Navigate to Jobs tab and open this job's detail
                  router.push({
                    pathname: '/(tabs)/jobs',
                    params: { jobId: job.id }
                  });
                }}
              >
                <Animated.View
                  style={[
                    styles.orderCard,
                    {
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <View style={styles.orderAvatar}>
                        <Ionicons name="person" size={24} color={COLORS.primary} />
                      </View>
                      <View style={styles.orderDetails}>
                        <Text style={styles.orderName}>{job.customer?.name}</Text>
                        <View style={styles.orderMeta}>
                          <Ionicons name="location" size={14} color="#999" />
                          <Text style={styles.orderMetaText}>
                            {job.distance ? `${Number(job.distance).toFixed(1)} km away` : 'Distance N/A'}
                          </Text>
                          <Text style={styles.orderDot}>•</Text>
                          <Text style={styles.orderMetaText}>
                            {job.scheduled_datetime ? formatLocalTime(job.scheduled_datetime) : formatTime(job.scheduledTime)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.orderPrice}>
                      <Text style={styles.orderPriceText}>
                        RM {(() => {
                          const servicesTotal = job.services?.reduce((sum, s) => sum + s.price, 0) || 0;
                          const travelCost = job.travelCost || 0;
                          const earnings = (servicesTotal * 0.85) + travelCost;
                          return earnings.toFixed(2);
                        })()}
                      </Text>
                    </View>
                  </View>

                  {/* Countdown Timer */}
                  {(() => {
                    const TIMEOUT_SECONDS = 180; // 3 minutes
                    const createdAt = new Date(job.createdAt || job.created_at).getTime();
                    const timeElapsed = (currentTime - createdAt) / 1000;
                    const timeRemaining = Math.max(0, TIMEOUT_SECONDS - timeElapsed);
                    
                    const minutes = Math.floor(timeRemaining / 60);
                    const seconds = Math.floor(timeRemaining % 60);
                    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    
                    // Determine urgency color
                    let timerColor = Colors.primary; // Green: > 2 min
                    let bgColor = '#E8F5E9';
                    if (timeRemaining <= 60) {
                      timerColor = '#FF3B30'; // Red: < 1 min
                      bgColor = '#FFE8E8';
                    } else if (timeRemaining <= 120) {
                      timerColor = '#FFB800'; // Orange: 1-2 min
                      bgColor = '#FFF8E1';
                    }
                    
                    return (
                      <View style={[styles.timerContainer, { backgroundColor: bgColor }]}>
                        <Ionicons name="timer-outline" size={16} color={timerColor} />
                        <Text style={[styles.timerText, { color: timerColor }]}>
                          Respond within {formattedTime}
                        </Text>
                      </View>
                    );
                  })()}

                  {/* Tap to view details hint */}
                  <View style={styles.orderFooter}>
                    <Text style={styles.orderFooterText}>Tap to view details and respond</Text>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                  </View>
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Stats Grid - Production Quality */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              icon="calendar"
              label="This Month"
              value={`RM ${formatCurrency(stats.monthlyEarnings)}`}
              subtitle={`${stats.monthlyJobs} jobs`}
              color={COLORS.primary}
              onPress={() => router.push('/(tabs)/earnings')}
            />
            <StatCard
              icon="star"
              label="Rating"
              value={stats.avgRating.toFixed(1)}
              color="#FFB800"
              onPress={() => router.push('/(tabs)/reviews')}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="checkmark-circle"
              label="Total Completed"
              value={String(stats.totalCompleted)}
              subtitle="All time"
              color="#00C48C"
              onPress={() => router.push('/(tabs)/jobs')}
            />
            <StatCard
              icon="checkmark-done"
              label="Acceptance"
              value={`${stats.acceptance}%`}
              color={Colors.success}             />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, subtitle, color, onPress }: { icon: string; label: string; value: string; subtitle?: string; color: string; onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );
}


function KPI({ icon, color, label, value, accessibilityLabel }: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; value: string; accessibilityLabel?: string }) {
  return (
    <View style={styles.kpiCard} accessibilityLabel={accessibilityLabel || `${label}: ${value}`} accessibilityRole="text">
      <View style={[styles.kpiIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.quickAction}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityHint={`Navigate to ${label} screen`}
    >
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.quickActionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body.large,
    color: COLORS.text.secondary,
  },

  // Green Header (Grab Style)
  header: {
    paddingBottom: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },

  // Earnings Card in Header
  earningsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  earningsLeft: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  earningsValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  earningsSubtext: {
    fontSize: 13,
    color: '#666',
  },
  earningsRight: {
    alignItems: 'center',
    gap: 4,
  },
  earningsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8E8',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FF3B3015',
  },
  errorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF3B3020',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 2,
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#FF3B30',
    opacity: 0.8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Online/Offline Toggle (Prominent)
  toggleSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  toggleButton: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleOnline: {
    backgroundColor: COLORS.primary,
  },
  toggleOffline: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  toggleDisabled: {
    opacity: 0.6,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  toggleText: {
    fontSize: 18,
    fontWeight: '700',
  },
  toggleSwitch: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleSubtext: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Stats Grid
  statsGrid: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  statSubtitle: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },

  // Section
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#999',
  },

  // Order Card (New)
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  orderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderDetails: {
    flex: 1,
  },
  orderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderMetaText: {
    fontSize: 13,
    color: '#999',
  },
  orderDot: {
    fontSize: 13,
    color: '#999',
    marginHorizontal: 4,
  },
  orderPrice: {
    alignItems: 'flex-end',
  },
  orderPriceText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  orderFooterText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  declineBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#666',
  },
  acceptButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  acceptButtonLoading: {
    opacity: 0.7,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },

  // Active Order Card
  activeCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  activeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  activePulse: {
    position: 'relative',
  },
  activeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  activeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeMetaText: {
    fontSize: 13,
    color: '#999',
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  navigateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },


  // Verification Banner
  verificationBannerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  verificationBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  verificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationContent: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  verificationSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  verificationWarning: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
    marginTop: 6,
  },

  // Toast
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  toastText: {
    ...TYPOGRAPHY.body.medium,
    color: COLORS.text.inverse,
    fontWeight: '700' as const,
    flex: 1,
  },

  // KPI Styles
  kpiCard: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    minWidth: 100,
  },
  kpiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '800' as '800',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '500' as '500',
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  // Quick Action Styles
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '600' as '600',
    color: COLORS.text.primary,
    flex: 1,
  },

});
