// Conditional import - Mapbox requires custom dev build
let Mapbox: any = null;
try {
  Mapbox = require('@rnmapbox/maps').default;
} catch (e) {
  console.warn('⚠️  Mapbox native module not available. Use custom dev build for maps.');
}

// Get environment variable - works in both customer and partner apps
const getMapboxToken = () => {
  return process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
};

// Initialize Mapbox
export function initializeMapbox() {
  const token = getMapboxToken();
  
  if (!Mapbox) {
    console.warn('⚠️  Mapbox not available. Build a custom dev build to use maps.');
    return;
  }
  
  if (token) {
    Mapbox.setAccessToken(token);
    console.log('✅ Mapbox initialized');
  } else {
    console.warn('⚠️  Mapbox token not found');
  }
}

// Geocoding helper: Address → Coordinates
export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number }> {
  const token = getMapboxToken();
  if (!token) throw new Error('Mapbox token not configured');
  
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&country=MY&limit=1`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.features && data.features.length > 0) {
    const [lng, lat] = data.features[0].center;
    return { latitude: lat, longitude: lng };
  }
  
  throw new Error('Address not found');
}

// Reverse Geocoding: Coordinates → Address
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  const token = getMapboxToken();
  if (!token) throw new Error('Mapbox token not configured');
  
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.features && data.features.length > 0) {
    return data.features[0].place_name;
  }
  
  throw new Error('Location not found');
}

export { Mapbox };
