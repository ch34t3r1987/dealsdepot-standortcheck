import { GoogleGenAI } from "@google/genai";
import { PLZEntry } from "../types";

/**
 * Analysiert die geografische Verteilung der Einträge mittels Gemini.
 */
export async function analyzeDistribution(entries: PLZEntry[]): Promise<string> {
  if (entries.length === 0) return "Keine Daten vorhanden.";

  try {
    // Fixed: Always create a new instance right before use to ensure it picks up the latest API key from context.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const plzList = entries.map(e => `${e.code} (${e.city}, ${e.country})`).join(", ");
    
    // Fixed: Using the simple string content for generateContent as per documentation examples for basic text tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analysiere kurz diese Postleitzahlen-Liste einer Gruppe aus der DACH-Region: [${plzList}]. 
          Wo liegen die geografischen Schwerpunkte? Antworte in 1-2 prägnanten Sätzen auf Deutsch.`,
    });
    
    // Fixed: Access the .text property directly (not a function) to get the string output.
    return response.text || "Analyse abgeschlossen.";
  } catch (error: any) {
    console.error("Gemini API Fehler:", error);
    // Wir werfen den Fehler weiter, damit die UI darauf reagieren kann
    throw error;
  }
}
