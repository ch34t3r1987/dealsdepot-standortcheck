
import { GoogleGenAI } from "@google/genai";
import { PLZEntry } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeDistribution(entries: PLZEntry[]): Promise<string> {
  if (entries.length === 0) return "Noch keine Daten vorhanden.";
  
  const plzList = entries.map(e => e.code).join(", ");
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Hier ist eine Liste von deutschen Postleitzahlen einer Gruppe: [${plzList}]. 
      Analysiere die geografische Verteilung. Woher kommen die meisten? 
      Gibt es interessante regionale Cluster? Antworte kurz und prägnant auf Deutsch.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    return response.text || "Die Analyse konnte nicht erstellt werden.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Fehler bei der KI-Analyse.";
  }
}
