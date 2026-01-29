
import { GoogleGenAI, Type } from "@google/genai";
import { CountryCode } from "../types";

// Die API-Initialisierung erfolgt hier. Wir gehen davon aus, dass process.env.API_KEY vorhanden ist.
// Falls der Key ungültig ist (wie im Konsolen-Screenshot), greift das Fallback-System.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface GeocodeResult {
  lat: number;
  lng: number;
  city: string;
  state: string;
}

/**
 * Erweitertes Fallback-System für den Fall, dass die API (z.B. wegen ungültigem Key) nicht funktioniert.
 * Bietet Koordinaten für die wichtigsten PLZ-Leitzonen in Deutschland.
 */
function getLocalFallback(plz: string, country: CountryCode): GeocodeResult | null {
  if (country !== 'DE') return null;
  const zone = plz.substring(0, 1);
  const region = plz.substring(0, 2);
  
  // Spezifischere 2-Steller Fallbacks
  const subFallbacks: Record<string, GeocodeResult> = {
    '10': { lat: 52.5200, lng: 13.4050, city: "Berlin (Zentrum)", state: "Berlin" },
    '20': { lat: 53.5511, lng: 9.9937, city: "Hamburg (Zentrum)", state: "Hamburg" },
    '80': { lat: 48.1351, lng: 11.5820, city: "München (Zentrum)", state: "Bayern" },
    '60': { lat: 50.1109, lng: 8.6821, city: "Frankfurt a.M.", state: "Hessen" },
    '50': { lat: 50.9375, lng: 6.9603, city: "Köln", state: "NRW" },
    '70': { lat: 48.7758, lng: 9.1829, city: "Stuttgart", state: "Baden-Württemberg" },
    '04': { lat: 51.3397, lng: 12.3731, city: "Leipzig", state: "Sachsen" },
    '40': { lat: 51.2277, lng: 6.7735, city: "Düsseldorf", state: "NRW" },
  };

  if (subFallbacks[region]) return subFallbacks[region];

  // Generelle Zonen-Fallbacks
  const zoneFallbacks: Record<string, GeocodeResult> = {
    '0': { lat: 51.0504, lng: 13.7373, city: "Ost-Sachsen", state: "Sachsen" },
    '1': { lat: 52.5200, lng: 13.4050, city: "Berlin/Brandenburg", state: "Berlin" },
    '2': { lat: 53.5511, lng: 9.9937, city: "Norddeutschland", state: "Hamburg" },
    '3': { lat: 51.3127, lng: 9.4797, city: "Zentraldeutschland", state: "Hessen" },
    '4': { lat: 51.4556, lng: 7.0116, city: "Ruhrgebiet", state: "NRW" },
    '5': { lat: 50.7374, lng: 7.0982, city: "Rheinland", state: "NRW" },
    '6': { lat: 49.4875, lng: 8.4660, city: "Südwest", state: "Baden-Württemberg" },
    '7': { lat: 48.7758, lng: 9.1829, city: "Baden-Württemberg", state: "Baden-Württemberg" },
    '8': { lat: 48.1351, lng: 11.5820, city: "Süd-Bayern", state: "Bayern" },
    '9': { lat: 49.4521, lng: 11.0767, city: "Nord-Bayern/Franken", state: "Bayern" },
  };
  
  return zoneFallbacks[zone] || null;
}

export async function geocodePLZ(plz: string, country: CountryCode): Promise<GeocodeResult | null> {
  const countryName = country === 'DE' ? 'Deutschland' : country === 'AT' ? 'Österreich' : 'Schweiz';
  
  try {
    // Debug-Log für Entwickler (hilft bei der Analyse des API Keys)
    console.debug(`Geocoding request for ${plz} in ${countryName}...`);
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Verwende das empfohlene Modell für Basis-Text-Tasks
      contents: `Ermittle die geografischen Koordinaten (Zentrum), den Ortsnamen und das Bundesland/Kanton für die Postleitzahl "${plz}" in ${countryName}. Antworte ausschließlich in validem JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER, description: "Breitengrad" },
            lng: { type: Type.NUMBER, description: "Längengrad" },
            city: { type: Type.STRING, description: "Ortsname" },
            state: { type: Type.STRING, description: "Bundesland" }
          },
          required: ["lat", "lng", "city", "state"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Leere Antwort von Gemini erhalten.");
    
    const result = JSON.parse(text);
    if (result && typeof result.lat === 'number' && typeof result.lng === 'number') {
      return result as GeocodeResult;
    }
    
    throw new Error("Ungültiges JSON-Format erhalten.");
  } catch (error: any) {
    // Hier fangen wir den 400er Fehler (Invalid API Key) ab
    console.error("Geocoding Fehler detektiert:", error.message);
    
    const fallback = getLocalFallback(plz, country);
    if (fallback) {
      console.info("Nutze lokales Fallback-System für PLZ:", plz);
      return {
        ...fallback,
        city: `${fallback.city} (Fallback)`
      };
    }
    
    return null;
  }
}
