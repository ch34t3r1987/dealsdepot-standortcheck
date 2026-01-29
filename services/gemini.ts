import { GoogleGenAI } from "@google/genai";
import { PLZEntry } from "../types";

/**
 * Analysiert die geografische Verteilung der Einträge mittels Gemini.
 */
export async function analyzeDistribution(entries: PLZEntry[]): Promise<string> {
  if (entries.length === 0) return "Keine Daten vorhanden.";

  try {
    // Priorisiere APIGEM_KEY (den du gerade angelegt hast)
    const apiKey = (process.env.APIGEM_KEY || process.env.API_KEY || "").trim();
    
    if (!apiKey || apiKey === "undefined" || apiKey === "null") {
      console.error("API Key fehlt komplett in der Umgebung.");
      throw new Error("API_KEY_MISSING");
    }

    // Ein gültiger Google API Key beginnt fast immer mit 'AIza'
    if (!apiKey.startsWith("AIza")) {
      console.error("Der gefundene Key scheint kein gültiger Google API Key zu sein (startet nicht mit AIza).");
      throw new Error("API_KEY_INVALID_FORMAT");
    }

    const ai = new GoogleGenAI({ apiKey });
    const plzList = entries.map(e => `${e.code} (${e.city}, ${e.country})`).join(", ");
    
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest', // Stabilerer Alias
      contents: `Analysiere kurz diese Postleitzahlen-Liste einer Gruppe aus der DACH-Region: [${plzList}]. 
          Wo liegen die geografischen Schwerpunkte? Antworte in maximal zwei Sätzen auf Deutsch.`,
    });
    
    if (!response || !response.text) {
      throw new Error("EMPTY_RESPONSE");
    }

    return response.text;
  } catch (error: any) {
    console.error("Detaillierter Gemini API Fehler:", error);
    throw error;
  }
}
