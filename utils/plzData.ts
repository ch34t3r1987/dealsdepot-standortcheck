
import { PLZRegion, CountryCode } from '../types.ts';

// Deutschland (DE) - 2-stellig
const DE_REGIONS: Record<string, PLZRegion> = {
  "01": { prefix: "01", name: "Dresden", lat: 51.0504, lng: 13.7373 },
  "10": { prefix: "10", name: "Berlin", lat: 52.5200, lng: 13.4050 },
  "20": { prefix: "20", name: "Hamburg", lat: 53.5511, lng: 9.9937 },
  "30": { prefix: "30", name: "Hannover", lat: 52.3759, lng: 9.7320 },
  "40": { prefix: "40", name: "Düsseldorf", lat: 51.2277, lng: 6.7735 },
  "50": { prefix: "50", name: "Köln", lat: 50.9375, lng: 6.9603 },
  "60": { prefix: "60", name: "Frankfurt", lat: 50.1109, lng: 8.6821 },
  "70": { prefix: "70", name: "Stuttgart", lat: 48.7758, lng: 9.1829 },
  "80": { prefix: "80", name: "München", lat: 48.1351, lng: 11.5820 },
  "90": { prefix: "90", name: "Nürnberg", lat: 49.4521, lng: 11.0767 },
};

// Österreich (AT) - 1. Stelle definiert Region/Bundesland
const AT_REGIONS: Record<string, PLZRegion> = {
  "1": { prefix: "1", name: "Wien", lat: 48.2082, lng: 16.3738 },
  "2": { prefix: "2", name: "Niederösterreich Nord", lat: 48.4, lng: 16.5 },
  "3": { prefix: "3", name: "Niederösterreich Süd", lat: 48.1, lng: 15.6 },
  "4": { prefix: "4", name: "Oberösterreich", lat: 48.3069, lng: 14.2858 },
  "5": { prefix: "5", name: "Salzburg", lat: 47.8095, lng: 13.0550 },
  "6": { prefix: "6", name: "Tirol / Vorarlberg", lat: 47.2692, lng: 11.4041 },
  "7": { prefix: "7", name: "Burgenland", lat: 47.8444, lng: 16.5232 },
  "8": { prefix: "8", name: "Steiermark", lat: 47.0707, lng: 15.4395 },
  "9": { prefix: "9", name: "Kärnten", lat: 46.6241, lng: 14.3078 },
};

// Schweiz (CH) - 1. Stelle definiert Region
const CH_REGIONS: Record<string, PLZRegion> = {
  "1": { prefix: "1", name: "Genf / Lausanne", lat: 46.2044, lng: 6.1432 },
  "2": { prefix: "2", name: "Neuenburg / Jura", lat: 46.9900, lng: 6.9300 },
  "3": { prefix: "3", name: "Bern", lat: 46.9480, lng: 7.4474 },
  "4": { prefix: "4", name: "Basel", lat: 47.5596, lng: 7.5886 },
  "5": { prefix: "5", name: "Aarau", lat: 47.3925, lng: 8.0444 },
  "6": { prefix: "6", name: "Zentralschweiz / Tessin", lat: 47.0502, lng: 8.3093 },
  "7": { prefix: "7", name: "Graubünden", lat: 46.8500, lng: 9.5300 },
  "8": { prefix: "8", name: "Zürich", lat: 47.3769, lng: 8.5417 },
  "9": { prefix: "9", name: "St. Gallen", lat: 47.4239, lng: 9.3748 },
};

export function getCoordsForPLZ(plz: string, country: CountryCode): { lat: number; lng: number, region: string } {
  if (country === 'AT') {
    const firstDigit = plz.substring(0, 1);
    const reg = AT_REGIONS[firstDigit] || { name: "Österreich", lat: 47.5162, lng: 14.5501 };
    return { lat: reg.lat, lng: reg.lng, region: reg.name };
  }
  
  if (country === 'CH') {
    const firstDigit = plz.substring(0, 1);
    const reg = CH_REGIONS[firstDigit] || { name: "Schweiz", lat: 46.8182, lng: 8.2275 };
    return { lat: reg.lat, lng: reg.lng, region: reg.name };
  }

  // Fallback DE
  const prefix2 = plz.substring(0, 2);
  if (DE_REGIONS[prefix2]) {
    return { lat: DE_REGIONS[prefix2].lat, lng: DE_REGIONS[prefix2].lng, region: DE_REGIONS[prefix2].name };
  }
  
  const firstDigit = plz.substring(0, 1);
  const zones: Record<string, {lat: number, lng: number}> = {
    "0": { lat: 51.1, lng: 12.5 }, "1": { lat: 52.8, lng: 13.4 }, "2": { lat: 53.8, lng: 9.5 },
    "3": { lat: 51.8, lng: 9.5 }, "4": { lat: 51.5, lng: 7.0 }, "5": { lat: 50.4, lng: 7.5 },
    "6": { lat: 49.8, lng: 8.5 }, "7": { lat: 48.5, lng: 9.0 }, "8": { lat: 48.0, lng: 11.5 },
    "9": { lat: 49.8, lng: 11.0 }
  };
  
  return { 
    lat: zones[firstDigit]?.lat || 51.1657, 
    lng: zones[firstDigit]?.lng || 10.4515, 
    region: `Region ${firstDigit}xxxx` 
  };
}
