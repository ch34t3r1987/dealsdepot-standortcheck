export type CountryCode = 'DE' | 'AT' | 'CH';

export interface PLZEntry {
  id: string;
  code: string;
  nickname: string;
  country: CountryCode;
  timestamp: number;
  lat: number;
  lng: number;
  city?: string;
  state?: string; // Bundesland oder Kanton
}

export interface PLZRegion {
  prefix: string;
  name: string;
  lat: number;
  lng: number;
  state: string; // Zugehöriges Bundesland
}
