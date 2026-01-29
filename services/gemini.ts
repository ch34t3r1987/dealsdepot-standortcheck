import { GoogleGenAI } from "@google/genai";
import { PLZEntry } from "../types";

/**
 * Analysiert die geografische Verteilung der Einträge mittels Gemini.
 */
export async function analyzeDistribution(entries: PLZEntry[]): Promise<string> {
  if (entries.length === 0) return "Keine Daten vorhanden.";

  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey.includes("YOUR_API_KEY")) {
    throw new Error("KEY_INVALID");
  }

  try {
    // Neue Instanz erstellen um sicherzustellen, dass der aktuellste Key genutzt wird
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    const plzList = entries.map(e => `${e.code} (${e.city}, ${e.country})`).join(", ");
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Nutzt das effiziente Flash-Modell
      contents: {
        parts: [{
          text: `Analysiere kurz diese Postleitzahlen-Liste: [${plzList}]. 
          Wo kommen die meisten Leute her? Antworte in 1-2 kurzen Sätzen auf Deutsch.`
        }]
      }
    });
    
    return response.text || "Analyse abgeschlossen, aber kein Text generiert.";
  } catch (error: any) {
    console.error("Gemini Fehler:", error);
    const msg = error?.message?.toLowerCase() || "";
    
    if (msg.includes("key") || msg.includes("invalid") || msg.includes("unauthorized")) {
      throw new Error("KEY_INVALID");
    }
    
    if (msg.includes("quota") || msg.includes("limit")) {
      return "Das kostenlose Limit wurde erreicht. Bitte kurz warten und erneut versuchen.";
    }
    
    return "Die KI-Analyse ist gerade nicht erreichbar. Bitte prüfe deine Internetverbindung.";
  }
}
