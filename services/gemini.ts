import { GoogleGenAI } from "@google/genai";
import { PLZEntry } from "../types";

/**
 * Analysiert die geografische Verteilung der Einträge mittels Gemini.
 */
export async function analyzeDistribution(entries: PLZEntry[]): Promise<string> {
  if (entries.length === 0) return "Keine Daten vorhanden.";

  try {
    // Initialisierung erfolgt strikt mit dem process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const plzList = entries.map(e => `${e.code} (${e.city}, ${e.country})`).join(", ");
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analysiere die folgende Liste von Postleitzahlen einer Gruppe aus der DACH-Region: [${plzList}]. 
      Wo liegen die geografischen Schwerpunkte? Gibt es Cluster in bestimmten Ballungsräumen? 
      Antworte kurz und prägnant in maximal 3 Sätzen auf Deutsch.`,
    });
    
    // Direkter Zugriff auf die .text Property des Response-Objekts
    return response.text || "Die Analyse konnte keine Ergebnisse liefern.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Rückgabe einer hilfreichen Nachricht bei Fehlern (z.B. ungültiger Key oder Quota)
    return "KI-Analyse aktuell nicht verfügbar. Bitte sicherstellen, dass ein gültiger API-Schlüssel konfiguriert ist.";
  }
}
