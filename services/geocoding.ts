
import { CountryCode, GeocodeResult } from "../types";

/**
 * Geocoding Service unter Verwendung der OpenPLZAPI (openplzapi.org)
 * Unterstützt DE, AT, CH und LI.
 */
export async function geocodePLZ(plz: string, country: CountryCode): Promise<GeocodeResult | null> {
  // Mapping von CountryCode auf API-Pfad
  const countryPath = country.toLowerCase(); // 'de', 'at', 'ch'
  const url = `https://openplzapi.org/${countryPath}/Localities?postalCode=${plz}`;

  try {
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`OpenPLZAPI error for ${countryPath}/${plz}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Die API gibt ein Array von Orten zurück (eine PLZ kann mehrere Ortsteile haben)
    if (Array.isArray(data) && data.length > 0) {
      const bestMatch = data[0];
      
      // Extrahiere die relevanten Daten
      // OpenPLZAPI Felder: name, federalState.name, latitude, longitude
      return {
        lat: bestMatch.latitude,
        lng: bestMatch.longitude,
        city: bestMatch.name,
        state: bestMatch.federalState?.name || 'Unbekannt'
      };
    }

    return null;
  } catch (error) {
    console.error("Geocoding fetch failed:", error);
    // Fallback: Wenn die API down ist, könnten wir hier eine minimale Logik einbauen,
    // aber der User wünscht die API-Anbindung.
    return null;
  }
}
