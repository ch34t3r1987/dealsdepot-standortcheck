import { GoogleGenAI } from "@google/genai";
import { PLZEntry } from "../types";

/**
 * Analysiert die geografische Verteilung der Einträge mittels Gemini.
 */
export async function analyzeDistribution(entries: PLZEntry[]): Promise<string> {
  if (entries.length === 0) return "Keine Daten vorhanden.";

  try {
    // Greift auf die in Vercel definierte Variable APIGEM_KEY zu
    const apiKey = process.env.APIGEM_KEY;
    
    if (!apiKey || apiKey === "undefined") {
      throw new Error("APIGEM_KEY_MISSING");
    }

    const ai = new GoogleGenAI({ apiKey });
    const plzList = entries.map(e => `${e.code} (${e.city}, ${e.country})`).join(", ");
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analysiere kurz diese Postleitzahlen-Liste einer Gruppe aus der DACH-Region: [${plzList}]. 
          Wo liegen die geografischen Schwerpunkte? Antworte in maximal zwei Sätzen auf Deutsch.`,
    });
    
    return response.text || "Analyse abgeschlossen.";
  } catch (error: any) {
    console.error("Gemini API Fehler:", error);
    throw error;
  }
}
