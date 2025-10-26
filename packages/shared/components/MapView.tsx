import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { Mapbox as MapboxInstance, DEFAULT_MAP_STYLE, MAP_CONFIG } from '../utils/mapbox';
import type { Coordinates } from '../utils/location';

/**
 * MapView Component
 * 
 * Reusable map component with common functionality
 */

export interface MapViewProps {
  // Initial camera position
  initialCenter?: Coordinates;
  initialZoom?: number;
  
  // Markers
  markers?: Array<{
    id: string;
    coordinate: Coordinates;
    title?: string;
    description?: string;
    icon?: string;
    color?: string;
  }>;
  
  // User location
  showUserLocation?: boolean;
  followUserLocation?: boolean;
  
  // Styling
  style?: any;
  mapStyle?: string;
  
  // Interaction
  onPress?: (feature: any) => void;
  onLongPress?: (feature: any) => void;
  onMarkerPress?: (markerId: string) => void;
  onRegionChange?: (feature: any) => void;
  
  // Clustering
  enableClustering?: boolean;
  
  // Controls
  showCompass?: boolean;
  showScaleBar?: boolean;
  showZoomControls?: boolean;
  
  // Children (additional layers, markers, etc.)
  children?: React.ReactNode;
}

export interface MapViewHandle {
  flyTo: (coordinate: Coordinates, zoom?: number, duration?: number) => void;
  fitBounds: (
    coordinates: Coordinates[],
    padding?: number,
    duration?: number
  ) => void;
  getCenter: () => Promise<Coordinates | null>;
  getZoom: () => Promise<number | null>;
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(
  (
    {
      initialCenter = MAP_CONFIG.defaultCenter,
      initialZoom = MAP_CONFIG.defaultZoom,
      markers = [],
      showUserLocation = true,
      followUserLocation = false,
      style,
      mapStyle = DEFAULT_MAP_STYLE,
      onPress,
      onLongPress,
      onMarkerPress,
      onRegionChange,
      enableClustering = false,
      showCompass = true,
      showScaleBar = false,
      showZoomControls = false,
      children,
    },
    ref
  ) => {
    const mapRef = useRef<Mapbox.MapView>(null);
    const cameraRef = useRef<Mapbox.Camera>(null);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      flyTo: (coordinate: Coordinates, zoom?: number, duration?: number) => {
        cameraRef.current?.flyTo([coordinate.longitude, coordinate.latitude], duration);
        if (zoom !== undefined) {
          cameraRef.current?.zoomTo(zoom, duration);
        }
      },

      fitBounds: async (
        coordinates: Coordinates[],
        padding = 50,
        duration = MAP_CONFIG.animationDuration
      ) => {
        if (coordinates.length === 0) return;

        const bounds: [number, number][] = coordinates.map((coord) => [
          coord.longitude,
          coord.latitude,
        ]);

        cameraRef.current?.fitBounds(
          [bounds[0], bounds[bounds.length - 1]],
          [padding, padding, padding, padding],
          duration
        );
      },

      getCenter: async () => {
        try {
          const center = await mapRef.current?.getCenter();
          if (!center) return null;
          return {
            latitude: center[1],
            longitude: center[0],
          };
        } catch (error) {
          console.error('Error getting map center:', error);
          return null;
        }
      },

      getZoom: async () => {
        try {
          return await mapRef.current?.getZoom();
        } catch (error) {
          console.error('Error getting map zoom:', error);
          return null;
        }
      },
    }));

    const handleMapPress = useCallback(
      (feature: any) => {
        onPress?.(feature);
      },
      [onPress]
    );

    const handleMapLongPress = useCallback(
      (feature: any) => {
        onLongPress?.(feature);
      },
      [onLongPress]
    );

    const handleRegionChange = useCallback(
      (feature: any) => {
        onRegionChange?.(feature);
      },
      [onRegionChange]
    );

    return (
      <View style={[styles.container, style]}>
        <Mapbox.MapView
          ref={mapRef}
          style={styles.map}
          styleURL={mapStyle}
          onPress={handleMapPress}
          onLongPress={handleMapLongPress}
          onRegionDidChange={handleRegionChange}
          compassEnabled={showCompass}
          scaleBarEnabled={showScaleBar}
          zoomEnabled={true}
          scrollEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
        >
          <Mapbox.Camera
            ref={cameraRef}
            zoomLevel={initialZoom}
            centerCoordinate={[initialCenter.longitude, initialCenter.latitude]}
            animationDuration={MAP_CONFIG.animationDuration}
            followUserLocation={followUserLocation}
          />

          {/* User Location */}
          {showUserLocation && (
            <Mapbox.UserLocation
              visible={true}
              showsUserHeadingIndicator={true}
              androidRenderMode="gps"
            />
          )}

          {/* Markers */}
          {markers.map((marker) => (
            <Mapbox.MarkerView
              key={marker.id}
              id={marker.id}
              coordinate={[marker.coordinate.longitude, marker.coordinate.latitude]}
            >
              <View
                style={[
                  styles.marker,
                  { backgroundColor: marker.color || '#FF6B6B' },
                ]}
              >
                <View style={styles.markerInner} />
              </View>
            </Mapbox.MarkerView>
          ))}

          {/* Additional children (custom layers, shapes, etc.) */}
          {children}
        </Mapbox.MapView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFF',
  },
});

MapView.displayName = 'MapView';
