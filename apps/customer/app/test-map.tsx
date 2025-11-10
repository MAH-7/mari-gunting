import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Mapbox } from '../utils/mapbox';
import { Colors, theme } from '@mari-gunting/shared/theme';

export default function TestMapScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mapbox Test</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Map */}
      <Mapbox.MapView
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
        zoomEnabled={true}
        scrollEnabled={true}
      >
        <Mapbox.Camera
          zoomLevel={14}
          centerCoordinate={[101.6869, 3.1390]} // Kuala Lumpur
          animationMode="flyTo"
          animationDuration={2000}
        />

        {/* Example Marker - KLCC */}
        <Mapbox.PointAnnotation
          id="marker1"
          coordinate={[101.7115, 3.1569]}
        >
          <View style={styles.marker}>
            <Ionicons name="location" size={40} color={Colors.primary} />
          </View>
        </Mapbox.PointAnnotation>

        {/* Example Marker - Bukit Bintang */}
        <Mapbox.PointAnnotation
          id="marker2"
          coordinate={[101.7120, 3.1478]}
        >
          <View style={styles.barberMarker}>
            <Ionicons name="cut" size={24} color={Colors.white} />
          </View>
        </Mapbox.PointAnnotation>
      </Mapbox.MapView>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>✅ Mapbox Working!</Text>
        <Text style={styles.infoText}>
          You can now use maps in your app. Try pinching to zoom and dragging to pan.
        </Text>
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => Alert.alert('Test', 'Mapbox is configured correctly!')}
        >
          <Text style={styles.testButtonText}>Test Alert</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  stepsContainer: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  stepText: {
    fontSize: 14,
    color: Colors.text.primary,
    fontFamily: 'monospace',
    marginBottom: 12,
    lineHeight: 20,
  },
  docsButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  docsButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray[500],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  map: {
    flex: 1,
  },
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  barberMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoBox: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.gray[500],
    lineHeight: 20,
    marginBottom: 16,
  },
  testButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
