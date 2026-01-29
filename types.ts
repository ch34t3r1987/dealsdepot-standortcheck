
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
}

export interface PLZRegion {
  prefix: string;
  name: string;
  lat: number;
  lng: number;
}
