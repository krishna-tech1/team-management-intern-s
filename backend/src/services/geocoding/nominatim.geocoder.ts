import { ReverseGeocoder, GeocodingResult } from './geocoder.interface';

export class NominatimGeocoder implements ReverseGeocoder {
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            'User-Agent': 'Traxa-Management-System/1.0 (admin@traxa.com)',
            'Accept-Language': 'en',
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (response.status === 429) {
        throw new Error('Nominatim rate limited (429)');
      }

      if (!response.ok) {
        throw new Error(`Nominatim HTTP error: ${response.statusText}`);
      }

      const data: any = await response.json();
      if (!data || !data.address) {
        throw new Error('Nominatim returned empty address structure');
      }

      const address = data.address;
      const city = address.city || address.town || address.village || address.suburb || '';
      const state = address.state || address.region || '';
      const country = address.country || '';
      const postalCode = address.postcode || '';

      return {
        formattedAddress: data.display_name || `${latitude}, ${longitude}`,
        city: city || undefined,
        state: state || undefined,
        country: country || undefined,
        postalCode: postalCode || undefined,
      };
    } catch (error: any) {
      clearTimeout(timeout);
      throw new Error(`NominatimGeocoder error: ${error.message}`);
    }
  }
}
