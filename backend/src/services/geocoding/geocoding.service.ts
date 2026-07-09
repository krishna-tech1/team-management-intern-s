import { GoogleGeocoder } from './google.geocoder';
import { NominatimGeocoder } from './nominatim.geocoder';
import { GeocodingResult, ReverseGeocoder } from './geocoder.interface';

const cache = new Map<string, GeocodingResult>();

export class GeocodingService {
  private primaryGeocoder: ReverseGeocoder;
  private secondaryGeocoder: ReverseGeocoder;

  constructor() {
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleApiKey) {
      this.primaryGeocoder = new GoogleGeocoder(googleApiKey);
      this.secondaryGeocoder = new NominatimGeocoder();
    } else {
      this.primaryGeocoder = new NominatimGeocoder();
      this.secondaryGeocoder = {
        reverseGeocode: async (lat, lon) => {
          throw new Error('No secondary geocoder configured');
        }
      };
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
    const cacheKey = `${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    try {
      // Try primary geocoder
      const result = await this.primaryGeocoder.reverseGeocode(latitude, longitude);
      cache.set(cacheKey, result);
      return result;
    } catch (primaryError: any) {
      console.warn(`⚠️ Primary geocoder failed: ${primaryError.message}. Trying fallback...`);
      try {
        // Try secondary geocoder
        const result = await this.secondaryGeocoder.reverseGeocode(latitude, longitude);
        cache.set(cacheKey, result);
        return result;
      } catch (secondaryError: any) {
        console.error(`❌ Both geocoders failed. Using coordinates fallback. Error: ${secondaryError.message}`);
        // Return fallback coordinates address so attendance never crashes
        return {
          formattedAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          city: 'Unknown',
          state: 'Unknown',
          country: 'Unknown',
        };
      }
    }
  }
}

export const geocodingService = new GeocodingService();
