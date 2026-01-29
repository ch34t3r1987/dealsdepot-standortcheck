import { GoogleGenAI } from "@google/genai";
import { PLZEntry } from "../types";

/**
 * Analysiert die geografische Verteilung der Einträge mittels Gemini.
 */
export async function analyzeDistribution(entries: PLZEntry[]): Promise<string> {
  if (entries.length === 0) return "Keine Daten vorhanden.";

  try {
    // CRITICAL: Create a new instance right before the call to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const plzList = entries.map(e => `${e.code} (${e.city}, ${e.country})`).join(", ");
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [{
          text: `Analysiere die folgende Liste von Postleitzahlen einer Gruppe aus der DACH-Region: [${plzList}]. 
          Wo liegen die geografischen Schwerpunkte? Gibt es Cluster in bestimmten Ballungsräumen? 
          Antworte kurz und prägnant in maximal 3 Sätzen auf Deutsch.`
        }]
      }
    });
    
    if (!response.text) {
      throw new Error("Empty response from AI");
    }

    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    const errorMessage = error?.message || "";
    if (errorMessage.includes("API key not valid") || errorMessage.includes("Requested entity was not found")) {
      throw new Error("KEY_INVALID");
    }
    
    return "KI-Analyse aktuell nicht verfügbar. Bitte prüfe deine Internetverbindung.";
  }
}
