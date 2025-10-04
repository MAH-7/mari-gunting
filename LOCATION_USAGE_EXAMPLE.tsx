// ============================================================================
// LOCATION USAGE EXAMPLES
// Copy these examples to your components when you need location features
// ============================================================================

import { useLocation } from '@/hooks/useLocation';
import { locationService } from '@/services/locationService';
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';

// ============================================================================
// EXAMPLE 1: Get Location on Button Press (Recommended for Development)
// ============================================================================
export function Example1_ButtonTrigger() {
  const { getCurrentLocation, hasPermission } = useLocation();
  const [userLocation, setUserLocation] = useState(null);

  const handleGetLocation = async () => {
    const location = await getCurrentLocation(true); // true = with address
    if (location) {
      setUserLocation(location);
      console.log('User location:', location);
      // Use location for API calls, etc.
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={handleGetLocation}>
        <Text>📍 Get My Location</Text>
      </TouchableOpacity>
      
      {userLocation && (
        <Text>
          Lat: {userLocation.latitude}, Lng: {userLocation.longitude}
          {userLocation.address && `\nAddress: ${userLocation.address}`}
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// EXAMPLE 2: Auto-Get Location When Component Loads
// ============================================================================
export function Example2_AutoLoad() {
  const { location, hasPermission, getCurrentLocation, isLoading } = useLocation();

  useEffect(() => {
    if (hasPermission) {
      getCurrentLocation(); // Automatically get location
    }
  }, [hasPermission]);

  if (isLoading) {
    return <Text>Getting your location...</Text>;
  }

  if (!location) {
    return <Text>Location not available</Text>;
  }

  return (
    <View>
      <Text>Your Location: {location.latitude}, {location.longitude}</Text>
    </View>
  );
}

// ============================================================================
// EXAMPLE 3: Find Nearby Barbers with Distance
// ============================================================================
export function Example3_NearbyBarbers() {
  const { location, hasPermission, getCurrentLocation } = useLocation();
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(false);

  const findNearbyBarbers = async () => {
    setLoading(true);
    
    // Get location first
    const userLocation = await getCurrentLocation();
    if (!userLocation) {
      Alert.alert('Location Required', 'Please enable location to find nearby barbers');
      setLoading(false);
      return;
    }

    // Fetch barbers from API
    const response = await api.getBarbers({
      location: {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        radius: 10, // 10 km
      },
    });

    // Calculate distance for each barber
    const barbersWithDistance = response.data.data.map((barber) => ({
      ...barber,
      distance: locationService.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        barber.location.latitude,
        barber.location.longitude
      ),
    }));

    // Sort by distance
    barbersWithDistance.sort((a, b) => a.distance - b.distance);
    setBarbers(barbersWithDistance);
    setLoading(false);
  };

  return (
    <View>
      <TouchableOpacity onPress={findNearbyBarbers}>
        <Text>🔍 Find Nearby Barbers</Text>
      </TouchableOpacity>

      {barbers.map((barber) => (
        <View key={barber.id}>
          <Text>{barber.name}</Text>
          <Text>{barber.distance.toFixed(1)} km away</Text>
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// EXAMPLE 4: Calculate Travel Cost
// ============================================================================
export function Example4_TravelCost() {
  const { location, getCurrentLocation } = useLocation();
  const [travelCost, setTravelCost] = useState(null);
  
  const RATE_PER_KM = 3; // RM 3 per km

  const calculateCost = async (barberLat: number, barberLng: number) => {
    const userLocation = await getCurrentLocation();
    if (!userLocation) return;

    const distance = locationService.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      barberLat,
      barberLng
    );

    const cost = distance * RATE_PER_KM;
    const minCost = 5; // Minimum RM 5
    
    setTravelCost(Math.max(cost, minCost));
  };

  return (
    <View>
      {travelCost && (
        <View>
          <Text>Travel Cost: RM {travelCost.toFixed(2)}</Text>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// EXAMPLE 5: Optional Location (Graceful Degradation)
// ============================================================================
export function Example5_OptionalLocation() {
  const { hasPermission, getCurrentLocation } = useLocation();
  const [showManualInput, setShowManualInput] = useState(false);

  const handleLocationChoice = async () => {
    if (hasPermission) {
      // Try to get location
      const location = await getCurrentLocation(true);
      if (location) {
        // Use location
        console.log('Using GPS location:', location);
      } else {
        // Failed, show manual input
        setShowManualInput(true);
      }
    } else {
      // No permission, show manual input
      setShowManualInput(true);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={handleLocationChoice}>
        <Text>📍 Use My Location</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setShowManualInput(true)}>
        <Text>✏️ Enter Address Manually</Text>
      </TouchableOpacity>

      {showManualInput && (
        <TextInput
          placeholder="Enter your address"
          // ...
        />
      )}
    </View>
  );
}

// ============================================================================
// EXAMPLE 6: Show Location Status Indicator
// ============================================================================
export function Example6_StatusIndicator() {
  const { hasPermission, location, isLoading } = useLocation();

  if (isLoading) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#00B14F" />
        <Text>Getting location...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text>⚠️</Text>
        <Text>Location access not granted</Text>
      </View>
    );
  }

  if (location) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text>✅</Text>
        <Text>Location: {location.address || 'Available'}</Text>
      </View>
    );
  }

  return (
    <View>
      <Text>📍 Location not available</Text>
    </View>
  );
}

// ============================================================================
// EXAMPLE 7: Real-time Location Tracking (For Active Bookings)
// ============================================================================
export function Example7_RealTimeTracking() {
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    // Start tracking when component mounts
    const startTracking = async () => {
      const success = await locationService.startWatchingLocation((location) => {
        setCurrentLocation(location);
        console.log('Location updated:', location);
        // Send to backend, update map, etc.
      });

      if (!success) {
        Alert.alert('Error', 'Could not start location tracking');
      }
    };

    startTracking();

    // Stop tracking when component unmounts
    return () => {
      locationService.stopWatchingLocation();
    };
  }, []);

  return (
    <View>
      {currentLocation && (
        <Text>
          Current: {currentLocation.latitude}, {currentLocation.longitude}
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// EXAMPLE 8: Check GPS Status Before Important Action
// ============================================================================
export function Example8_GPSCheck() {
  const handleBooking = async () => {
    // Check if GPS is enabled
    const gpsEnabled = await locationService.isLocationEnabled();
    
    if (!gpsEnabled) {
      Alert.alert(
        'GPS Required',
        'Please enable GPS to calculate accurate travel costs',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Enable GPS', 
            onPress: () => locationService.showEnableGPSAlert() 
          }
        ]
      );
      return;
    }

    // Check permission
    const permission = await locationService.checkPermission();
    if (!permission.granted) {
      Alert.alert('Location Permission Required', 'We need your location to proceed');
      return;
    }

    // Proceed with booking
    proceedWithBooking();
  };

  return (
    <TouchableOpacity onPress={handleBooking}>
      <Text>Book Now</Text>
    </TouchableOpacity>
  );
}
