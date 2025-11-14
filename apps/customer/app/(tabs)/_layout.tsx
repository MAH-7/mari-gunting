import { Tabs } from 'expo-router';
import { Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServiceModal } from '@/components/ServiceModal';
import { LocationPermissionModal } from '@/components/LocationPermissionModal';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import { router } from 'expo-router';
import { Colors, theme } from '@mari-gunting/shared/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function TabBarIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <Ionicons
      name={name}
      size={24}
      color={focused ? Colors.primary : Colors.gray[400]}
      style={{
        marginBottom: -3,
      }}
    />
  );
}

export default function TabLayout() {
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { status: locationStatus, requestPermission } = useLocationPermission();
  const insets = useSafeAreaInsets();

  const handleServiceAction = (action: 'quick-book' | 'barbers' | 'barbershops') => {
    setShowServiceModal(false);
    
    if (locationStatus === 'granted') {
      const routes = {
        'quick-book': '/quick-book',
        'barbers': '/barbers',
        'barbershops': '/barbershops',
      };
      setTimeout(() => router.push(routes[action]), 200);
    } else {
      setTimeout(() => setShowLocationModal(true), 200);
    }
  };

  const handleRequestLocationPermission = async () => {
    setShowLocationModal(false);
    await requestPermission();
  };

  const handleManualLocation = () => {
    setShowLocationModal(false);
    router.push('/profile/addresses');
  };

  return (
    <>
      <Tabs
        screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarStyle: {
          backgroundColor: Colors.white,
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
          paddingTop: Platform.OS === 'ios' ? 12 : 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Booking',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="service"
        options={{
          title: 'Service',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={'cut-outline'} focused={false} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => setShowServiceModal(true)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'gift' : 'gift-outline'} focused={focused} />
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
      </Tabs>
      
      {/* Service Modal */}
      <ServiceModal 
        visible={showServiceModal} 
        onClose={() => setShowServiceModal(false)}
        onServiceAction={handleServiceAction}
      />

      {/* Location Permission Modal - Managed at layout level */}
      <LocationPermissionModal
        visible={showLocationModal}
        onRequestPermission={handleRequestLocationPermission}
        onManualLocation={handleManualLocation}
        onDismiss={() => setShowLocationModal(false)}
      />
    </>
  );
}
