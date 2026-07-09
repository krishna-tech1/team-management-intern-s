export interface GeocodingResult {
  formattedAddress: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface ReverseGeocoder {
  reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult>;
}
