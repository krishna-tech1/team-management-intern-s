/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Validate GPS coordinates
 * Latitude: -90 to 90
 * Longitude: -180 to 180
 */
export const validateCoordinates = (
  latitude: number,
  longitude: number
): { isValid: boolean; error?: string } => {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return { isValid: false, error: 'Latitude and longitude are required' };
  }

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return { isValid: false, error: 'Latitude and longitude must be numbers' };
  }

  if (latitude < -90 || latitude > 90) {
    return { isValid: false, error: 'Latitude must be between -90 and 90' };
  }

  if (longitude < -180 || longitude > 180) {
    return { isValid: false, error: 'Longitude must be between -180 and 180' };
  }

  return { isValid: true };
};

/**
 * Check if employee is within allowed radius
 * Default radius: 200 meters (for checkout validation)
 */
export const isWithinRadius = (
  originLat: number,
  originLon: number,
  targetLat: number,
  targetLon: number,
  radiusMeters: number = 200
): boolean => {
  const distance = calculateDistance(originLat, originLon, targetLat, targetLon);
  return distance <= radiusMeters;
};

/**
 * Get address string (placeholder - would use reverse geocoding API in production)
 * Currently returns formatted coordinates
 */
export const getAddressFromCoordinates = (
  latitude: number,
  longitude: number,
  accuracy?: number
): string => {
  // Placeholder implementation
  // In production, integrate with Google Geocoding API
  const accuracyStr = accuracy ? ` (±${Math.round(accuracy)}m)` : '';
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}${accuracyStr}`;
};

/**
 * Format location data for response
 */
export const formatLocationData = (
  latitude: number,
  longitude: number,
  address?: string,
  accuracy?: number
) => {
  return {
    latitude,
    longitude,
    address: address || getAddressFromCoordinates(latitude, longitude, accuracy),
    accuracy: accuracy || null,
    timestamp: new Date(),
  };
};

/**
 * Validate location accuracy
 * Consider it poor if accuracy > 50 meters
 */
export const isAccuracyAcceptable = (accuracy: number, threshold: number = 50): boolean => {
  return accuracy <= threshold;
};
