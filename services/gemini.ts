import { GoogleGenAI } from "@google/genai";
import { PLZEntry } from "../types";

/**
 * Analysiert die geografische Verteilung der Einträge mittels Gemini.
 */
export async function analyzeDistribution(entries: PLZEntry[]): Promise<string> {
  if (entries.length === 0) return "Keine Daten vorhanden.";

  // Wir nutzen gemini-3-flash-preview für diese Basis-Textaufgabe
  const modelName = 'gemini-3-flash-preview';

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const plzList = entries.map(e => `${e.code} (${e.city}, ${e.country})`).join(", ");
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Analysiere kurz diese Postleitzahlen-Liste einer Gruppe aus der DACH-Region: [${plzList}]. 
          Wo liegen die geografischen Schwerpunkte? Antworte in maximal zwei Sätzen auf Deutsch.`,
    });
    
    return response.text || "Analyse abgeschlossen.";
  } catch (error: any) {
    console.error("Gemini API Fehler:", error);
    // Wir werfen den Fehler für die UI weiter
    throw error;
  }
}
