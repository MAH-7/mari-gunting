import { Tabs } from 'expo-router';
import { Platform, Alert, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/shared/constants';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import { supabase } from '@mari-gunting/shared/config/supabase';
import { useStore } from '@mari-gunting/shared/store/useStore';
import { useQueryClient } from '@tanstack/react-query';

// Global notification sound ref - accessible across all tabs
export const notificationSound = { current: null as any | null };

type IconName = keyof typeof Ionicons.glyphMap;

function TabBarIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <Ionicons
      name={name}
      size={24}
      color={focused ? COLORS.primary : COLORS.text.tertiary}
      style={{
        marginBottom: -3,
      }}
    />
  );
}

export default function PartnerTabLayout() {
  const insets = useSafeAreaInsets();
  const currentUser = useStore((state) => state.currentUser);
  const queryClient = useQueryClient();
  const [accountType, setAccountType] = useState<'freelance' | 'barbershop'>('freelance');
  const [isLoading, setIsLoading] = useState(true);
  const [barberId, setBarberId] = useState<string | null>(null);

  // Load account type
  useEffect(() => {
    AsyncStorage.getItem('partnerAccountType').then(type => {
      if (type) {
        setAccountType(type as 'freelance' | 'barbershop');
      }
      setIsLoading(false);
    });
  }, []);

  // Fetch barber ID for global alerts
  useEffect(() => {
    const fetchBarberId = async () => {
      if (!currentUser?.id) return;
      
      const { data, error } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', currentUser.id)
        .single();
      
      if (error) {
        console.error('❌ Error fetching barber ID (global):', error);
        return;
      }
      
      console.log('✅ Barber ID found for global alerts:', data.id);
      setBarberId(data.id);
    };
    
    fetchBarberId();
  }, [currentUser?.id]);

  // Setup notification sound globally (runs once on tabs mount)
  const player = useAudioPlayer(require('../../assets/sounds/notification.wav'));
  
  useEffect(() => {
    // Store player globally for access across tabs
    notificationSound.current = player;
    console.log('🔊 Notification sound loaded globally');
    console.log('🔍 Available methods:', Object.keys(player));
    
    return () => {
      console.log('🔊 Notification sound will be cleaned up');
    };
  }, [player]);

  // GLOBAL: Realtime subscription for NEW booking alerts only
  // This runs on app startup, separate from Jobs screen subscription
  useEffect(() => {
    if (!barberId) return;

    console.log('🔔 Setting up GLOBAL new booking alerts for barber:', barberId);

    const channel = supabase
      .channel(`global-booking-alerts-${barberId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Only NEW bookings for alerts
          schema: 'public',
          table: 'bookings',
          filter: `barber_id=eq.${barberId}`,
        },
        async (payload) => {
          console.log('🔔 NEW BOOKING (global alert)!', payload);
          
          // Play notification sound
          if (notificationSound.current) {
            try {
              // Restart from beginning
              notificationSound.current.seekTo(0);
              notificationSound.current.play();
              console.log('✅ Sound played!');
            } catch (error: any) {
              console.error('❌ Sound error:', error?.message || error);
            }
          }
          
          // Vibrate device
          if (Platform.OS === 'ios') {
            Vibration.vibrate([0, 400, 200, 400]);
          } else {
            // Android: Use longer single vibration for compatibility
            // Some devices ignore patterns and only vibrate once
            Vibration.vibrate(800); // Single 800ms vibration (more noticeable)
          }
          
          // Show alert
          Alert.alert(
            '🔔 New Booking Request!',
            'You have a new booking request. Tap to view.',
            [
              { text: 'Later', style: 'cancel' },
              { 
                text: 'View Now', 
                onPress: () => {
                  // Refresh data when user taps "View Now"
                  queryClient.invalidateQueries({ queryKey: ['barber-bookings'] });
                  queryClient.invalidateQueries({ queryKey: ['barber-booking-counts'] });
                }
              }
            ]
          );
        }
      )
      .subscribe((status) => {
        console.log('🔔 Global alerts status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up global booking alerts');
      supabase.removeChannel(channel);
    };
  }, [barberId, queryClient]);

  if (isLoading) {
    return null; // Or a loading indicator
  }

  const commonScreenOptions = {
    headerShown: false,
    tabBarActiveTintColor: COLORS.primary,
    tabBarInactiveTintColor: COLORS.text.tertiary,
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: '600' as '600',
      marginTop: 4,
    },
    tabBarStyle: {
      backgroundColor: COLORS.background.primary,
      borderTopWidth: 0,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      height: Platform.OS === 'ios' ? 95 : 70 + insets.bottom,
      paddingBottom: Platform.OS === 'ios' ? 32 : insets.bottom + 8,
      paddingTop: 12,
    },
  };

  if (accountType === 'freelance') {
    return (
      <Tabs screenOptions={commonScreenOptions}>
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="jobs"
          options={{
            title: 'Jobs',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name={focused ? 'briefcase' : 'briefcase-outline'} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="reviews"
          options={{
            title: 'Reviews',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name={focused ? 'star' : 'star-outline'} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            title: 'Earnings',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name={focused ? 'cash' : 'cash-outline'} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon name={focused ? 'person' : 'person-outline'} focused={focused} />
            ),
          }}
        />
        {/* Hide barbershop tabs from freelance mode */}
        <Tabs.Screen name="dashboard-shop" options={{ href: null }} />
        <Tabs.Screen name="bookings" options={{ href: null }} />
        <Tabs.Screen name="staff" options={{ href: null }} />
        <Tabs.Screen name="shop" options={{ href: null }} />
        <Tabs.Screen name="reports" options={{ href: null }} />
        <Tabs.Screen name="schedule" options={{ href: null }} />
      </Tabs>
    );
  }

  // Barbershop mode
  return (
    <Tabs screenOptions={commonScreenOptions}>
      <Tabs.Screen
        name="dashboard-shop"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'business' : 'business-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: 'Staff',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'people' : 'people-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'storefront' : 'storefront-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'bar-chart' : 'bar-chart-outline'} focused={focused} />
          ),
        }}
      />
      {/* Hide freelance tabs from barbershop mode */}
      <Tabs.Screen name="dashboard" options={{ href: null }} />
      <Tabs.Screen name="jobs" options={{ href: null }} />
      <Tabs.Screen name="schedule" options={{ href: null }} />
      <Tabs.Screen name="reviews" options={{ href: null }} />
      <Tabs.Screen name="earnings" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
