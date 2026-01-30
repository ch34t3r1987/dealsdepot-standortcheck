
import { GoogleGenAI, Type } from "@google/genai";
import { CountryCode, GeocodeResult } from "../types";

/**
 * Initializes the AI client. 
 * We use Gemini 3 Pro for complex geocoding tasks that require high precision.
 */
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Enhanced Local Fallback Database.
 * While the AI is the primary source for precision, this provides a safety net.
 * Added more specific entries for requested corrections.
 */
const DE_PLZ_FALLBACK: Record<string, GeocodeResult> = {
  "08412": { lat: 50.7364, lng: 12.3756, city: "Werdau", state: "Sachsen" },
  "08060": { lat: 50.7061, lng: 12.4735, city: "Zwickau (Marienthal/Pölbitz)", state: "Sachsen" },
  // General regions as before
  "01": { lat: 51.0504, lng: 13.7373, city: "Dresden", state: "Sachsen" },
  "10": { lat: 52.5200, lng: 13.4050, city: "Berlin", state: "Berlin" },
  "20": { lat: 53.5511, lng: 9.9937, city: "Hamburg", state: "Hamburg" },
  "30": { lat: 52.3759, lng: 9.7320, city: "Hannover", state: "Niedersachsen" },
  "40": { lat: 51.2277, lng: 6.7735, city: "Düsseldorf", state: "NRW" },
  "50": { lat: 50.9375, lng: 6.9603, city: "Köln", state: "NRW" },
  "60": { lat: 50.1109, lng: 8.6821, city: "Frankfurt a.M.", state: "Hessen" },
  "70": { lat: 48.7758, lng: 9.1829, city: "Stuttgart", state: "Baden-Württemberg" },
  "80": { lat: 48.1351, lng: 11.5820, city: "München", state: "Bayern" },
  "90": { lat: 49.4521, lng: 11.0767, city: "Nürnberg", state: "Bayern" },
};

export async function geocodePLZ(plz: string, country: CountryCode): Promise<GeocodeResult | null> {
  const countryName = country === 'DE' ? 'Deutschland' : country === 'AT' ? 'Österreich' : 'Schweiz';
  
  // 1. Check if we have an exact hardcoded match for common/reported corrections
  if (DE_PLZ_FALLBACK[plz]) {
    return DE_PLZ_FALLBACK[plz];
  }

  try {
    // 2. Use Gemini 3 Pro with Google Search for real-time high-precision lookup
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Ermittle die EXAKTEN geografischen Koordinaten (Breitengrad, Längengrad), den offiziellen Stadtnamen/Stadtteil und das Bundesland für die spezifische Postleitzahl "${plz}" in ${countryName}. 
      Es ist wichtig, dass die Koordinaten präzise den Mittelpunkt dieses spezifischen PLZ-Gebiets darstellen und nicht nur das Zentrum der nächstgrößeren Stadt.
      Beispiel: 08412 ist Werdau, nicht Zwickau.
      Antworte ausschließlich im JSON-Format.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER, description: "Präziser Breitengrad" },
            lng: { type: Type.NUMBER, description: "Präziser Längengrad" },
            city: { type: Type.STRING, description: "Offizieller Orts- oder Stadtteilname" },
            state: { type: Type.STRING, description: "Bundesland/Kanton" }
          },
          required: ["lat", "lng", "city", "state"]
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      if (result && typeof result.lat === 'number' && typeof result.lng === 'number') {
        return result as GeocodeResult;
      }
    }
  } catch (error) {
    console.warn("High-precision AI geocoding failed, falling back to regional database.", error);
  }

  // 3. Last resort: Regional fallback logic based on prefixes
  const regionPrefix = plz.substring(0, 2);
  const zonePrefix = plz.substring(0, 1);
  
  return DE_PLZ_FALLBACK[regionPrefix] || DE_PLZ_FALLBACK[zonePrefix] || null;
}
