/**
 * Google Maps Integration Utilities
 * Placeholder for future Maps API integration
 */

export interface MapsConfig {
  apiKey: string;
  isEnabled: boolean;
}

const mapsConfig: MapsConfig = {
  apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  isEnabled: !!process.env.GOOGLE_MAPS_API_KEY,
};

/**
 * Generate Google Maps URL for coordinates
 * Format: https://maps.google.com/?q=latitude,longitude
 */
export const generateMapsUrl = (latitude: number, longitude: number): string => {
  return `https://maps.google.com/?q=${latitude},${longitude}`;
};

/**
 * Generate Google Maps embed URL for iframe
 * Requires Maps API key for full functionality
 */
export const generateMapsEmbedUrl = (latitude: number, longitude: number): string => {
  const apiKey = mapsConfig.apiKey;
  if (!apiKey || !mapsConfig.isEnabled) {
    // Fallback to simple maps URL
    return generateMapsUrl(latitude, longitude);
  }

  // Full embed URL with API key
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}`;
};

/**
 * Get directions URL between two points
 */
export const getDirectionsUrl = (
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number
): string => {
  return `https://maps.google.com/maps?saddr=${originLat},${originLon}&daddr=${destLat},${destLon}`;
};

/**
 * Format location with maps link for display
 */
export const formatLocationWithMapsLink = (
  latitude: number,
  longitude: number,
  address?: string
): {
  latitude: number;
  longitude: number;
  address?: string;
  mapsUrl: string;
} => {
  return {
    latitude,
    longitude,
    address,
    mapsUrl: generateMapsUrl(latitude, longitude),
  };
};

/**
 * Reverse geocode (placeholder)
 * In production, integrate with Google Geocoding API
 * For now, just returns coordinates as string
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  // Placeholder implementation
  // Would call Google Geocoding API in production
  const apiKey = mapsConfig.apiKey;

  if (!apiKey || !mapsConfig.isEnabled) {
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }

  try {
    // This is a placeholder - actual implementation would call the API
    // const response = await fetch(
    //   `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    // );
    // const data = await response.json();
    // return data.results?.[0]?.formatted_address || `${latitude}, ${longitude}`;

    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
};

/**
 * Get maps configuration status
 */
export const getMapsConfigStatus = (): MapsConfig => {
  return {
    ...mapsConfig,
    apiKey: mapsConfig.apiKey ? '***CONFIGURED***' : 'NOT_CONFIGURED',
  };
};

export default {
  generateMapsUrl,
  generateMapsEmbedUrl,
  getDirectionsUrl,
  formatLocationWithMapsLink,
  reverseGeocode,
  getMapsConfigStatus,
};
