import { ReverseGeocoder, GeocodingResult } from './geocoder.interface';

export class GoogleGeocoder implements ReverseGeocoder {
  constructor(private apiKey: string) {}

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.apiKey}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Google Maps API HTTP error: ${response.statusText}`);
      }

      const data: any = await response.json();
      if (data.status !== 'OK' || !data.results?.[0]) {
        throw new Error(`Google Maps Geocoding failed: ${data.status || 'No results'}`);
      }

      const result = data.results[0];
      const components = result.address_components || [];

      let city = '';
      let state = '';
      let country = '';
      let postalCode = '';

      for (const component of components) {
        const types = component.types || [];
        if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          state = component.long_name;
        } else if (types.includes('country')) {
          country = component.long_name;
        } else if (types.includes('postal_code')) {
          postalCode = component.long_name;
        }
      }

      return {
        formattedAddress: result.formatted_address || `${latitude}, ${longitude}`,
        city: city || undefined,
        state: state || undefined,
        country: country || undefined,
        postalCode: postalCode || undefined,
      };
    } catch (error: any) {
      clearTimeout(timeout);
      throw new Error(`GoogleGeocoder error: ${error.message}`);
    }
  }
}
