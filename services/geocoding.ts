
import { GoogleGenAI, Type } from "@google/genai";
import { CountryCode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface GeocodeResult {
  lat: number;
  lng: number;
  city: string;
  state: string;
}

/**
 * Grober Fallback für Deutschland, falls die KI nicht erreichbar ist.
 * Ordnet PLZ-Leitzonen (erste Ziffer) ungefähren Koordinaten zu.
 */
function getLocalFallback(plz: string, country: CountryCode): GeocodeResult | null {
  if (country !== 'DE') return null;
  const zone = plz[0];
  const fallbacks: Record<string, GeocodeResult> = {
    '0': { lat: 51.0504, lng: 13.7373, city: "Region Dresden/Leipzig", state: "Sachsen" },
    '1': { lat: 52.5200, lng: 13.4050, city: "Region Berlin/Potsdam", state: "Berlin/Brandenburg" },
    '2': { lat: 53.5511, lng: 9.9937, city: "Region Hamburg/Bremen", state: "Hamburg/Niedersachsen" },
    '3': { lat: 52.3759, lng: 9.7320, city: "Region Hannover/Kassel", state: "Niedersachsen/Hessen" },
    '4': { lat: 51.4556, lng: 7.0116, city: "Region Essen/Düsseldorf", state: "NRW" },
    '5': { lat: 50.9375, lng: 6.9603, city: "Region Köln/Bonn", state: "NRW" },
    '6': { lat: 50.1109, lng: 8.6821, city: "Region Frankfurt/Saarbrücken", state: "Hessen/Saarland" },
    '7': { lat: 48.7758, lng: 9.1829, city: "Region Stuttgart/Karlsruhe", state: "Baden-Württemberg" },
    '8': { lat: 48.1351, lng: 11.5820, city: "Region München/Augsburg", state: "Bayern" },
    '9': { lat: 49.4521, lng: 11.0767, city: "Region Nürnberg/Erfurt", state: "Bayern/Thüringen" },
  };
  return fallbacks[zone] || null;
}

export async function geocodePLZ(plz: string, country: CountryCode): Promise<GeocodeResult | null> {
  try {
    const countryName = country === 'DE' ? 'Deutschland' : country === 'AT' ? 'Österreich' : 'Schweiz';
    
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest", // Stabileres Modell-Alias
      contents: `Ermittle die geografischen Koordinaten (Zentrum), den Ortsnamen und das Bundesland/Kanton für die Postleitzahl "${plz}" in ${countryName}. Antworte nur im JSON-Format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER },
            city: { type: Type.STRING },
            state: { type: Type.STRING }
          },
          required: ["lat", "lng", "city", "state"]
        }
      }
    });

    const result = JSON.parse(response.text || "null");
    if (result && result.lat && result.lng) return result;
    
    throw new Error("Invalid result format");
  } catch (error) {
    console.warn("Geocoding API Error, using fallback:", error);
    // Wenn die KI fehlschlägt (z.B. API Key ungültig), nutzen wir den lokalen Fallback
    const fallback = getLocalFallback(plz, country);
    if (fallback) {
      return {
        ...fallback,
        city: `${fallback.city} (Grob-Ortung)` // Kennzeichnung für den User
      };
    }
    return null;
  }
}
