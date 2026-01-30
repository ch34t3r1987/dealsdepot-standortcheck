
import { CountryCode, GeocodeResult } from "../types";

/**
 * Geocoding Service unter Verwendung der OpenPLZAPI (openplzapi.org)
 * Unterstützt DE, AT, CH und LI.
 */
export async function geocodePLZ(plz: string, country: CountryCode): Promise<GeocodeResult | null> {
  const countryPath = country.toLowerCase();
  const url = `https://openplzapi.org/${countryPath}/Localities?postalCode=${plz}`;

  try {
    const response = await fetch(url, {
      headers: { 'accept': 'application/json' }
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const bestMatch = data[0];
      
      const lat = parseFloat(bestMatch.latitude);
      const lng = parseFloat(bestMatch.longitude);

      if (isNaN(lat) || isNaN(lng)) return null;

      return {
        lat,
        lng,
        city: bestMatch.name || 'Unbekannt',
        state: bestMatch.federalState?.name || 'Unbekannt'
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding fetch failed:", error);
    return null;
  }
}
