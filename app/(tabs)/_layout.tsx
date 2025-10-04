import { Tabs } from 'expo-router';
import { Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ServiceModal } from '@/components/ServiceModal';

type IconName = keyof typeof Ionicons.glyphMap;

function TabBarIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <Ionicons
      name={name}
      size={24}
      color={focused ? '#00B14F' : '#9CA3AF'}
      style={{
        marginBottom: -3,
      }}
    />
  );
}

export default function TabLayout() {
  const [showServiceModal, setShowServiceModal] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00B14F',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          height: Platform.OS === 'ios' ? 95 : 75,
          paddingBottom: Platform.OS === 'ios' ? 32 : 16,
          paddingTop: 12,
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
      />
    </>
  );
}
