
import { CountryCode } from '../types';

export const DE_STATES = [
  "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen", "Hamburg", 
  "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen", "Nordrhein-Westfalen", 
  "Rheinland-Pfalz", "Saarland", "Sachsen", "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen"
];

/**
 * Erzeugt einen winzigen zufälligen Offset für die Karte, damit Pins bei gleicher PLZ nicht exakt übereinander liegen.
 */
export function applyJitter(lat: number, lng: number, seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const jLat = ((hash & 0xFF) / 255 - 0.5) * 0.004;
  const jLng = (((hash >> 8) & 0xFF) / 255 - 0.5) * 0.004;
  return { lat: lat + jLat, lng: lng + jLng };
}
