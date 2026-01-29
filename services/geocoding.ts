
import { GoogleGenAI, Type } from "@google/genai";
import { CountryCode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface GeocodeResult {
  lat: number;
  lng: number;
  city: string;
  state: string;
}

export async function geocodePLZ(plz: string, country: CountryCode): Promise<GeocodeResult | null> {
  try {
    const countryName = country === 'DE' ? 'Deutschland' : country === 'AT' ? 'Österreich' : 'Schweiz';
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Ermittle die exakten geografischen Koordinaten (Zentrum), den Ortsnamen und das Bundesland/Kanton für die Postleitzahl "${plz}" in ${countryName}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER, description: "Breitengrad" },
            lng: { type: Type.NUMBER, description: "Längengrad" },
            city: { type: Type.STRING, description: "Name der Stadt oder Gemeinde" },
            state: { type: Type.STRING, description: "Bundesland oder Kanton" }
          },
          required: ["lat", "lng", "city", "state"]
        }
      }
    });

    const result = JSON.parse(response.text || "null");
    return result;
  } catch (error) {
    console.error("Geocoding Error:", error);
    return null;
  }
}
