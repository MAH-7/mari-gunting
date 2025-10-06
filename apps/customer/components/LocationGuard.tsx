import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/hooks/useLocation';

interface LocationGuardProps {
  children: React.ReactNode;
  requireLocation?: boolean;
}

/**
 * LocationGuard - Wraps components that require location access
 * Shows permission request UI if location is not granted
 */
export function LocationGuard({ children, requireLocation = true }: LocationGuardProps) {
  const { permission, isLoading, requestPermission, getCurrentLocation } = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Give time for permission check to complete
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [permission]);

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (result.granted) {
      // Get location immediately after permission granted
      await getCurrentLocation(false);
    }
  };

  // If we don't require location, just render children
  if (!requireLocation) {
    return <>{children}</>;
  }

  // Show loading while checking permission
  if (isChecking || isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00B14F" />
        <Text style={styles.loadingText}>Checking location services...</Text>
      </View>
    );
  }

  // Show permission request screen if not granted
  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={64} color="#00B14F" />
          </View>
          
          <Text style={styles.title}>Location Access Required</Text>
          
          <Text style={styles.description}>
            Mari Gunting needs access to your location to:
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="search" size={20} color="#00B14F" />
              <Text style={styles.featureText}>Find nearby barbers</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="calculator" size={20} color="#00B14F" />
              <Text style={styles.featureText}>Calculate accurate travel costs</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="navigate" size={20} color="#00B14F" />
              <Text style={styles.featureText}>Show real-time barber location</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="time" size={20} color="#00B14F" />
              <Text style={styles.featureText}>Provide accurate arrival times</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleRequestPermission}
            activeOpacity={0.8}
          >
            <Ionicons name="location" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Enable Location</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            Your location is only used while you're using the app
          </Text>
        </View>
      </View>
    );
  }

  // Permission granted, render children
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  featureList: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#00B14F',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  note: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});
