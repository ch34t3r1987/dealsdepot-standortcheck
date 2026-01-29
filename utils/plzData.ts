import { PLZRegion, CountryCode } from '../types';

// Deutsche Leitregionen mit Bundesland-Zuordnung
const DE_REGIONS: Record<string, PLZRegion> = {
  "01": { prefix: "01", name: "Dresden", lat: 51.0504, lng: 13.7373, state: "Sachsen" },
  "02": { prefix: "02", name: "Bautzen", lat: 51.1814, lng: 14.4251, state: "Sachsen" },
  "03": { prefix: "03", name: "Cottbus", lat: 51.7563, lng: 14.3329, state: "Brandenburg" },
  "04": { prefix: "04", name: "Leipzig", lat: 51.3397, lng: 12.3731, state: "Sachsen" },
  "06": { prefix: "06", name: "Halle (Saale)", lat: 51.4828, lng: 11.9697, state: "Sachsen-Anhalt" },
  "07": { prefix: "07", name: "Gera", lat: 50.8808, lng: 12.0794, state: "Thüringen" },
  "08": { prefix: "08", name: "Zwickau", lat: 50.7189, lng: 12.4923, state: "Sachsen" },
  "09": { prefix: "09", name: "Chemnitz", lat: 50.8333, lng: 12.9167, state: "Sachsen" },
  "10": { prefix: "10", name: "Berlin", lat: 52.5200, lng: 13.4050, state: "Berlin" },
  "12": { prefix: "12", name: "Berlin Süd-Ost", lat: 52.4500, lng: 13.5500, state: "Berlin" },
  "13": { prefix: "13", name: "Berlin Nord", lat: 52.5800, lng: 13.3500, state: "Berlin" },
  "14": { prefix: "14", name: "Potsdam", lat: 52.3989, lng: 13.0657, state: "Brandenburg" },
  "15": { prefix: "15", name: "Frankfurt (Oder)", lat: 52.3425, lng: 14.5381, state: "Brandenburg" },
  "16": { prefix: "16", name: "Oranienburg", lat: 52.7537, lng: 13.2356, state: "Brandenburg" },
  "17": { prefix: "17", name: "Neubrandenburg", lat: 53.5569, lng: 13.2606, state: "Mecklenburg-Vorpommern" },
  "18": { prefix: "18", name: "Rostock", lat: 54.0833, lng: 12.1333, state: "Mecklenburg-Vorpommern" },
  "19": { prefix: "19", name: "Schwerin", lat: 53.6333, lng: 11.4167, state: "Mecklenburg-Vorpommern" },
  "20": { prefix: "20", name: "Hamburg", lat: 53.5511, lng: 9.9937, state: "Hamburg" },
  "21": { prefix: "21", name: "Lüneburg", lat: 53.2526, lng: 10.4144, state: "Niedersachsen" },
  "22": { prefix: "22", name: "Hamburg-West", lat: 53.5800, lng: 9.9000, state: "Hamburg" },
  "23": { prefix: "23", name: "Lübeck", lat: 53.8655, lng: 10.6866, state: "Schleswig-Holstein" },
  "24": { prefix: "24", name: "Kiel", lat: 54.3233, lng: 10.1228, state: "Schleswig-Holstein" },
  "25": { prefix: "25", name: "Elmshorn", lat: 53.7547, lng: 9.6521, state: "Schleswig-Holstein" },
  "26": { prefix: "26", name: "Oldenburg", lat: 53.1435, lng: 8.2146, state: "Niedersachsen" },
  "27": { prefix: "27", name: "Bremerhaven", lat: 53.5396, lng: 8.5809, state: "Bremen" },
  "28": { prefix: "28", name: "Bremen", lat: 53.0793, lng: 8.8017, state: "Bremen" },
  "29": { prefix: "29", name: "Celle", lat: 52.6256, lng: 10.0825, state: "Niedersachsen" },
  "30": { prefix: "30", name: "Hannover", lat: 52.3759, lng: 9.7320, state: "Niedersachsen" },
  "31": { prefix: "31", name: "Hameln", lat: 52.1032, lng: 9.3597, state: "Niedersachsen" },
  "32": { prefix: "32", name: "Bielefeld", lat: 52.0302, lng: 8.5325, state: "Nordrhein-Westfalen" },
  "33": { prefix: "33", name: "Paderborn", lat: 51.7189, lng: 8.7575, state: "Nordrhein-Westfalen" },
  "34": { prefix: "34", name: "Kassel", lat: 51.3127, lng: 9.4797, state: "Hessen" },
  "35": { prefix: "35", name: "Gießen", lat: 50.5872, lng: 8.6755, state: "Hessen" },
  "36": { prefix: "36", name: "Fulda", lat: 50.5508, lng: 9.6783, state: "Hessen" },
  "37": { prefix: "37", name: "Göttingen", lat: 51.5413, lng: 9.9158, state: "Niedersachsen" },
  "38": { prefix: "38", name: "Braunschweig", lat: 52.2689, lng: 10.5268, state: "Niedersachsen" },
  "39": { prefix: "39", name: "Magdeburg", lat: 52.1205, lng: 11.6276, state: "Sachsen-Anhalt" },
  "40": { prefix: "40", name: "Düsseldorf", lat: 51.2277, lng: 6.7735, state: "Nordrhein-Westfalen" },
  "41": { prefix: "41", name: "Mönchengladbach", lat: 51.1911, lng: 6.4417, state: "Nordrhein-Westfalen" },
  "42": { prefix: "42", name: "Wuppertal", lat: 51.2562, lng: 7.1508, state: "Nordrhein-Westfalen" },
  "44": { prefix: "44", name: "Dortmund", lat: 51.5136, lng: 7.4653, state: "Nordrhein-Westfalen" },
  "45": { prefix: "45", name: "Essen", lat: 51.4556, lng: 7.0116, state: "Nordrhein-Westfalen" },
  "46": { prefix: "46", name: "Oberhausen", lat: 51.4713, lng: 6.8524, state: "Nordrhein-Westfalen" },
  "47": { prefix: "47", name: "Duisburg", lat: 51.4344, lng: 6.7623, state: "Nordrhein-Westfalen" },
  "48": { prefix: "48", name: "Münster", lat: 51.9607, lng: 7.6261, state: "Nordrhein-Westfalen" },
  "49": { prefix: "49", name: "Osnabrück", lat: 52.2726, lng: 8.0498, state: "Niedersachsen" },
  "50": { prefix: "50", name: "Köln", lat: 50.9375, lng: 6.9603, state: "Nordrhein-Westfalen" },
  "51": { prefix: "51", name: "Bergisch Gladbach", lat: 50.9918, lng: 7.1297, state: "Nordrhein-Westfalen" },
  "52": { prefix: "52", name: "Aachen", lat: 50.7753, lng: 6.0839, state: "Nordrhein-Westfalen" },
  "53": { prefix: "53", name: "Bonn", lat: 50.7339, lng: 7.0982, state: "Nordrhein-Westfalen" },
  "54": { prefix: "54", name: "Trier", lat: 49.7492, lng: 6.6371, state: "Rheinland-Pfalz" },
  "55": { prefix: "55", name: "Mainz", lat: 49.9929, lng: 8.2473, state: "Rheinland-Pfalz" },
  "56": { prefix: "56", name: "Koblenz", lat: 50.3567, lng: 7.5939, state: "Rheinland-Pfalz" },
  "57": { prefix: "57", name: "Siegen", lat: 50.8742, lng: 8.0243, state: "Nordrhein-Westfalen" },
  "58": { prefix: "58", name: "Hagen", lat: 51.3619, lng: 7.4770, state: "Nordrhein-Westfalen" },
  "59": { prefix: "59", name: "Hamm", lat: 51.6739, lng: 7.8159, state: "Nordrhein-Westfalen" },
  "60": { prefix: "60", name: "Frankfurt am Main", lat: 50.1109, lng: 8.6821, state: "Hessen" },
  "61": { prefix: "61", name: "Bad Homburg", lat: 50.2291, lng: 8.6117, state: "Hessen" },
  "63": { prefix: "63", name: "Aschaffenburg", lat: 49.9744, lng: 9.1461, state: "Bayern" },
  "64": { prefix: "64", name: "Darmstadt", lat: 49.8728, lng: 8.6512, state: "Hessen" },
  "65": { prefix: "65", name: "Wiesbaden", lat: 50.0782, lng: 8.2398, state: "Hessen" },
  "66": { prefix: "66", name: "Saarbrücken", lat: 49.2326, lng: 6.9927, state: "Saarland" },
  "67": { prefix: "67", name: "Ludwigshafen", lat: 49.4811, lng: 8.4352, state: "Rheinland-Pfalz" },
  "68": { prefix: "68", name: "Mannheim", lat: 49.4875, lng: 8.4660, state: "Baden-Württemberg" },
  "69": { prefix: "69", name: "Heidelberg", lat: 49.3988, lng: 8.6724, state: "Baden-Württemberg" },
  "70": { prefix: "70", name: "Stuttgart", lat: 48.7758, lng: 9.1829, state: "Baden-Württemberg" },
  "71": { prefix: "71", name: "Böblingen", lat: 48.6833, lng: 9.0167, state: "Baden-Württemberg" },
  "72": { prefix: "72", name: "Tübingen", lat: 48.5213, lng: 9.0576, state: "Baden-Württemberg" },
  "73": { prefix: "73", name: "Göppingen", lat: 48.7027, lng: 9.6521, state: "Baden-Württemberg" },
  "74": { prefix: "74", name: "Heilbronn", lat: 49.1425, lng: 9.2108, state: "Baden-Württemberg" },
  "75": { prefix: "75", name: "Pforzheim", lat: 48.8911, lng: 8.7042, state: "Baden-Württemberg" },
  "76": { prefix: "76", name: "Karlsruhe", lat: 49.0069, lng: 8.4037, state: "Baden-Württemberg" },
  "77": { prefix: "77", name: "Offenburg", lat: 48.4708, lng: 7.9408, state: "Baden-Württemberg" },
  "78": { prefix: "78", name: "Freiburg im Breisgau", lat: 47.9990, lng: 7.8421, state: "Baden-Württemberg" },
  "79": { prefix: "79", name: "Lörrach", lat: 47.6156, lng: 7.6614, state: "Baden-Württemberg" },
  "80": { prefix: "80", name: "München", lat: 48.1351, lng: 11.5820, state: "Bayern" },
  "82": { prefix: "82", name: "Fürstenfeldbruck", lat: 48.1778, lng: 11.2556, state: "Bayern" },
  "83": { prefix: "83", name: "Rosenheim", lat: 47.8561, lng: 12.1289, state: "Bayern" },
  "84": { prefix: "84", name: "Landshut", lat: 48.5372, lng: 12.1522, state: "Bayern" },
  "85": { prefix: "85", name: "Ingolstadt", lat: 48.7665, lng: 11.4258, state: "Bayern" },
  "86": { prefix: "86", name: "Augsburg", lat: 48.3705, lng: 10.8978, state: "Bayern" },
  "87": { prefix: "87", name: "Kempten (Allgäu)", lat: 47.7286, lng: 10.3158, state: "Bayern" },
  "88": { prefix: "88", name: "Friedrichshafen", lat: 47.6542, lng: 9.4797, state: "Baden-Württemberg" },
  "89": { prefix: "89", name: "Ulm", lat: 48.4011, lng: 9.9876, state: "Baden-Württemberg" },
  "90": { prefix: "90", name: "Nürnberg", lat: 49.4521, lng: 11.0767, state: "Bayern" },
  "91": { prefix: "91", name: "Erlangen", lat: 49.5897, lng: 11.0039, state: "Bayern" },
  "92": { prefix: "92", name: "Amberg", lat: 49.4444, lng: 11.8483, state: "Bayern" },
  "93": { prefix: "93", name: "Regensburg", lat: 49.0134, lng: 12.1016, state: "Bayern" },
  "94": { prefix: "94", name: "Passau", lat: 48.5667, lng: 13.4667, state: "Bayern" },
  "95": { prefix: "95", name: "Hof", lat: 50.3167, lng: 11.9167, state: "Bayern" },
  "96": { prefix: "96", name: "Bamberg", lat: 49.8917, lng: 10.8861, state: "Bayern" },
  "97": { prefix: "97", name: "Würzburg", lat: 49.7913, lng: 9.9534, state: "Bayern" },
  "98": { prefix: "98", name: "Suhl", lat: 50.6106, lng: 10.6931, state: "Thüringen" },
  "99": { prefix: "99", name: "Erfurt", lat: 50.9781, lng: 11.0292, state: "Thüringen" },
};

export const DE_STATES = [
  "Baden-Württemberg", "Bayern", "Berlin", "Brandenburg", "Bremen", "Hamburg", 
  "Hessen", "Mecklenburg-Vorpommern", "Niedersachsen", "Nordrhein-Westfalen", 
  "Rheinland-Pfalz", "Saarland", "Sachsen", "Sachsen-Anhalt", "Schleswig-Holstein", "Thüringen"
];

// Österreichische Leitzonen (Bundesländer)
const AT_REGIONS: Record<string, PLZRegion> = {
  "1": { prefix: "1", name: "Wien", lat: 48.2082, lng: 16.3738, state: "Wien" },
  "2": { prefix: "2", name: "Niederösterreich Ost", lat: 48.4000, lng: 16.5000, state: "Niederösterreich" },
  "3": { prefix: "3", name: "Niederösterreich West", lat: 48.2000, lng: 15.6000, state: "Niederösterreich" },
  "4": { prefix: "4", name: "Oberösterreich", lat: 48.3064, lng: 14.2858, state: "Oberösterreich" },
  "5": { prefix: "5", name: "Salzburg", lat: 47.8095, lng: 13.0550, state: "Salzburg" },
  "6": { prefix: "6", name: "Tirol / Vorarlberg", lat: 47.2692, lng: 11.4041, state: "Tirol" },
  "7": { prefix: "7", name: "Burgenland", lat: 47.8444, lng: 16.5233, state: "Burgenland" },
  "8": { prefix: "8", name: "Steiermark", lat: 47.0707, lng: 15.4395, state: "Steiermark" },
  "9": { prefix: "9", name: "Kärnten", lat: 46.6247, lng: 14.3053, state: "Kärnten" },
};

// Schweizer Postkreis-Regionen
const CH_REGIONS: Record<string, PLZRegion> = {
  "1": { prefix: "1", name: "Westschweiz (Lausanne/Genf)", lat: 46.5197, lng: 6.6323, state: "Vaud/Genève" },
  "2": { prefix: "2", name: "Westschweiz (Neuchâtel/Jura)", lat: 46.9896, lng: 6.9293, state: "Neuchâtel/Jura" },
  "3": { prefix: "3", name: "Bern / Oberwallis", lat: 46.9480, lng: 7.4474, state: "Bern/Valais" },
  "4": { prefix: "4", name: "Basel", lat: 47.5596, lng: 7.5886, state: "Basel" },
  "5": { prefix: "5", name: "Aargau", lat: 47.3925, lng: 8.0442, state: "Aargau" },
  "6": { prefix: "6", name: "Zentralschweiz / Tessin", lat: 47.0502, lng: 8.3093, state: "Zentralschweiz/Ticino" },
  "7": { prefix: "7", name: "Graubünden", lat: 46.8508, lng: 9.5320, state: "Graubünden" },
  "8": { prefix: "8", name: "Zürich", lat: 47.3769, lng: 8.5417, state: "Zürich" },
  "9": { prefix: "9", name: "Ostschweiz", lat: 47.4239, lng: 9.3748, state: "Ostschweiz" },
};

export function getCoordsForPLZ(plz: string, country: CountryCode): { lat: number; lng: number, region: string, state: string } {
  const firstDigit = plz.substring(0, 1);
  const prefix2 = plz.substring(0, 2);

  if (country === 'DE') {
    if (DE_REGIONS[prefix2]) {
      return { 
        lat: DE_REGIONS[prefix2].lat, 
        lng: DE_REGIONS[prefix2].lng, 
        region: DE_REGIONS[prefix2].name,
        state: DE_REGIONS[prefix2].state 
      };
    }
    const fallback: Record<string, { lat: number, lng: number, name: string, state: string }> = { 
      "0": { lat: 51.0, lng: 13.0, name: "Sachsen", state: "Sachsen" }, 
      "1": { lat: 52.5, lng: 13.4, name: "Berlin", state: "Berlin" }, 
      "2": { lat: 53.5, lng: 10.0, name: "Hamburg", state: "Hamburg" }, 
      "3": { lat: 52.0, lng: 9.5, name: "Niedersachsen", state: "Niedersachsen" }, 
      "4": { lat: 51.5, lng: 7.5, name: "NRW Nord", state: "Nordrhein-Westfalen" }, 
      "5": { lat: 50.5, lng: 7.5, name: "Rheinland", state: "Rheinland-Pfalz" }, 
      "6": { lat: 50.0, lng: 8.5, name: "Hessen", state: "Hessen" }, 
      "7": { lat: 48.5, lng: 9.0, name: "Ba-Wü", state: "Baden-Württemberg" }, 
      "8": { lat: 48.0, lng: 11.5, name: "Bayern Süd", state: "Bayern" }, 
      "9": { lat: 49.5, lng: 11.0, name: "Bayern Nord", state: "Bayern" } 
    };
    const zone = fallback[firstDigit] || { lat: 51.1, lng: 10.4, name: "Deutschland", state: "Deutschland" };
    return { lat: zone.lat, lng: zone.lng, region: zone.name, state: zone.state };
  }

  if (country === 'AT') {
    if (AT_REGIONS[firstDigit]) {
      return { 
        lat: AT_REGIONS[firstDigit].lat, 
        lng: AT_REGIONS[firstDigit].lng, 
        region: AT_REGIONS[firstDigit].name,
        state: AT_REGIONS[firstDigit].state
      };
    }
    return { lat: 47.5162, lng: 14.5501, region: "Österreich", state: "Österreich" };
  }

  if (country === 'CH') {
    if (CH_REGIONS[firstDigit]) {
      return { 
        lat: CH_REGIONS[firstDigit].lat, 
        lng: CH_REGIONS[firstDigit].lng, 
        region: CH_REGIONS[firstDigit].name,
        state: CH_REGIONS[firstDigit].state
      };
    }
    return { lat: 46.8182, lng: 8.2275, region: "Schweiz", state: "Schweiz" };
  }
  
  return { lat: 51.1657, lng: 10.4515, region: "Europa", state: "Europa" };
}
