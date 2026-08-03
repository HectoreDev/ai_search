import type { PlanFilters } from "../types";

const STATE_NAMES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS",
  kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD", massachusetts: "MA",
  michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO", montana: "MT",
  nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND",
  ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI",
  "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
  vermont: "VT", virginia: "VA", washington: "WA", whasshington: "WA", washingthon: "WA", "west virginia": "WV", wisconsin: "WI",
  wyoming: "WY",
};

function numberBefore(text: string, terms: string[]) {
  const match = text.match(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(?:${terms.join("|")})`, "i"));
  return match ? Number(match[1].replace(",", ".")) : undefined;
}

export function parseLocally(message: string): PlanFilters {
  const normalized = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const beds = numberBefore(normalized, ["recamaras?", "habitaciones?", "dormitorios?", "beds?", "bedrooms?"]);
  const baths = numberBefore(normalized, ["banos?", "baths?", "bathrooms?"]);
  const garages = numberBefore(normalized, ["garajes?", "cocheras?", "garages?", "cars?"]);
  const stories = numberBefore(normalized, ["niveles?", "pisos?", "plantas?", "stories?"]);
  const sqftMatch = normalized.match(/([\d,.]+)\s*(?:sq\.?\s*ft|sqft|pies?\s+cuadrados?)/i);
  const states = Object.entries(STATE_NAMES)
    .filter(([name]) => new RegExp(`\\b${name}\\b`, "i").test(normalized))
    .map(([, abbreviation]) => abbreviation);
  const explicitCodes = normalized.match(/\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/gi) ?? [];
  const planName = normalized.match(/(?:plan|plano|modelo)\s+([a-z0-9][a-z0-9-]*)/i)?.[1];
  const sqft = sqftMatch ? Number(sqftMatch[1].replace(/,/g, "")) : undefined;

  return {
    name: planName ? `Plan ${planName}` : undefined,
    bedsMin: beds,
    bedsMax: beds,
    bathsMin: baths,
    bathsMax: baths,
    garagesMin: garages,
    garagesMax: garages,
    storiesMin: stories,
    storiesMax: stories,
    sqftMin: sqft,
    sqftMax: sqft,
    states: [...new Set([...states, ...explicitCodes.map((code) => code.toUpperCase())])],
  };
}

export async function parseWithAI(ai: Ai | undefined, message: string): Promise<PlanFilters> {
  const fallback = parseLocally(message);
  if (!ai) return fallback;

  try {
    const response = await ai.run("@cf/meta/llama-3.1-8b-instruct-fast", {
      messages: [
        { role: "system", content: "Extract floor-plan search filters. Return only JSON with optional keys: name, storiesMin, storiesMax, sqftMin, sqftMax, bedsMin, bedsMax, bathsMin, bathsMax, garagesMin, garagesMax, states. states must contain US two-letter abbreviations. Exact values use the same min and max." },
        { role: "user", content: message },
      ],
      response_format: { type: "json_object" },
    }) as { response?: string };
    const parsed = JSON.parse(response.response ?? "{}") as PlanFilters;
    return { ...fallback, ...parsed, states: parsed.states?.length ? parsed.states : fallback.states };
  } catch {
    return fallback;
  }
}
