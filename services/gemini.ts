import { GoogleGenAI } from "@google/genai";
import { PLZEntry } from "../types";

/**
 * Analysiert die geografische Verteilung der Einträge mittels Gemini.
 */
export async function analyzeDistribution(entries: PLZEntry[]): Promise<string> {
  if (entries.length === 0) return "Keine Daten vorhanden.";

  try {
    // Wir versuchen alle gängigen Wege, an den Key zu kommen
    // In manchen Umgebungen wird process.env vom Build-Tool durch den String "undefined" ersetzt
    const rawKey = process.env.APIGEM_KEY || process.env.API_KEY || "";
    const apiKey = typeof rawKey === 'string' ? rawKey.trim() : "";
    
    // Prüfe auf leere Werte oder den String "undefined"
    if (!apiKey || apiKey === "" || apiKey === "undefined" || apiKey === "null") {
      console.error("API Key wurde nicht gefunden oder ist der String 'undefined'");
      throw new Error("API_KEY_MISSING");
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
