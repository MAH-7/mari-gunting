import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/shared/constants';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [accountType, setAccountType] = useState<'freelance' | 'barbershop'>('freelance');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('partnerAccountType').then(type => {
      if (type) {
        setAccountType(type as 'freelance' | 'barbershop');
      }
      setIsLoading(false);
    });
  }, []);

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
