/**
 * Map Components Entrypoint
 * 
 * Dedicated entrypoint to avoid loading Mapbox when importing other shared components.
 * This prevents @rnmapbox/maps native module errors in Expo Go for screens that don't use maps.
 * 
 * Usage:
 * ```ts
 * import { MapView } from '@mari-gunting/shared/map';
 * ```
 */

export * from './components/MapView';
