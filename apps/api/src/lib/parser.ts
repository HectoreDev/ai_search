import { PRODUCT_TYPES, type PlanFilters, type ProductType } from "../types";

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

function dimension(text: string, name: "width" | "depth") {
  const aliases = name === "width" ? "width|wide|ancho" : "depth|deep|profundidad|fondo";
  const afterLabel = text.match(new RegExp(`(?:product\\s+)?(?:${aliases})\\s*(?:of|de|:|=)?\\s*(\\d+(?:[.,]\\d+)?)`, "i"));
  const beforeLabel = text.match(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(?:ft|feet|foot|pies?|')?\\s*(?:${aliases})`, "i"));
  const value = afterLabel?.[1] ?? beforeLabel?.[1];
  return value ? Number(value.replace(",", ".")) : undefined;
}

function parseProductTypes(text: string): ProductType[] {
  const types: ProductType[] = [];
  const add = (type: ProductType) => { if (!types.includes(type)) types.push(type); };
  if (/\b(?:sfd(?:\s+detach(?:ed)?)?|single[-\s]?family\s+detached|detached\s+home|casa\s+unifamiliar\s+independiente)\b/i.test(text)) add("SFD Detached");
  if (/\b(?:front[-\s]?load(?:ed)?|carga\s+frontal)\b/i.test(text)) add("Front Load");
  if (/\b(?:alley[-\s]?load(?:ed)?|carga\s+por\s+callejon)\b/i.test(text)) add("Alley Load");
  if (/\b(?:th|townhome|townhomes|town\s*house|town\s*houses|casa\s+adosada)\b/i.test(text)) add("TH");
  return types;
}

function normalizeProductType(value: string): ProductType | undefined {
  const normalized = value.trim().toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");
  if (/^(?:sfd|sfd detach|sfd detached|single family detached|detached)$/.test(normalized)) return "SFD Detached";
  if (/^front load(?:ed)?$/.test(normalized)) return "Front Load";
  if (/^alley load(?:ed)?$/.test(normalized)) return "Alley Load";
  if (/^(?:th|townhome|townhomes|town house|townhouse)$/.test(normalized)) return "TH";
  return PRODUCT_TYPES.find((type) => type.toLowerCase() === normalized);
}

export function normalizeParsedFilters(filters: PlanFilters): PlanFilters {
  const productTypes = [...new Set((filters.productTypes ?? []).map(normalizeProductType).filter((type): type is ProductType => Boolean(type)))];
  const states = [...new Set((filters.states ?? []).map((state) => state.trim().toUpperCase()).filter(Boolean))];
  return {
    ...filters,
    name: filters.name && /^\d+$/.test(filters.name.trim()) ? `Plan ${filters.name.trim()}` : filters.name,
    division: filters.division?.trim() || undefined,
    productTypes,
    states,
  };
}

export function parseLocally(message: string): PlanFilters {
  const normalized = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const beds = numberBefore(normalized, ["recamaras?", "habitaciones?", "dormitorios?", "beds?", "bedrooms?"]);
  const baths = numberBefore(normalized, ["banos?", "baths?", "bathrooms?"]);
  const garages = numberBefore(normalized, ["garajes?", "cocheras?", "garages?", "cars?"]);
  const stories = numberBefore(normalized, ["niveles?", "pisos?", "plantas?", "stories?"]);
  const productWidth = dimension(normalized, "width");
  const productDepth = dimension(normalized, "depth");
  const productTypes = parseProductTypes(normalized);
  const division = normalized.match(/\bdivision\s*(?:is|of|es|de|:|=)?\s*([a-z0-9][a-z0-9 &'/-]{1,60}?)(?=\s+(?:with|in|and|that|having|con|en|y|que)\b|[,.;]|$)/i)?.[1]?.trim();
  const sqftMatch = normalized.match(/([\d,.]+)\s*(?:sq\.?\s*ft|sqft|pies?\s+cuadrados?)/i);
  const states = Object.entries(STATE_NAMES)
    .filter(([name]) => new RegExp(`\\b${name}\\b`, "i").test(normalized))
    .map(([, abbreviation]) => abbreviation);
  const explicitCodes = normalized.match(/\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/gi) ?? [];
  const planName = normalized.match(/(?:plan|plano|modelo)\s+([a-z0-9][a-z0-9-]*)/i)?.[1];
  const sqft = sqftMatch ? Number(sqftMatch[1].replace(/,/g, "")) : undefined;

  return normalizeParsedFilters({
    name: planName ? `Plan ${planName}` : undefined,
    bedsMin: beds,
    bedsMax: beds,
    bathsMin: baths,
    bathsMax: baths,
    garagesMin: garages,
    garagesMax: garages,
    productWidthMin: productWidth,
    productWidthMax: productWidth,
    productDepthMin: productDepth,
    productDepthMax: productDepth,
    productTypes,
    division,
    storiesMin: stories,
    storiesMax: stories,
    sqftMin: sqft,
    sqftMax: sqft,
    states: [...new Set([...states, ...explicitCodes.map((code) => code.toUpperCase())])],
  });
}

export async function parseWithAI(ai: Ai | undefined, message: string): Promise<PlanFilters> {
  const fallback = parseLocally(message);
  if (!ai) return fallback;

  try {
    const response = await ai.run("@cf/meta/llama-3.1-8b-instruct-fast", {
      messages: [
        { role: "system", content: "Extract floor-plan search filters. Return only JSON with optional keys: name, storiesMin, storiesMax, sqftMin, sqftMax, bedsMin, bedsMax, bathsMin, bathsMax, garagesMin, garagesMax, productWidthMin, productWidthMax, productDepthMin, productDepthMax, productTypes, division, states. productTypes must contain only: SFD Detached, Front Load, Alley Load, TH. states must contain US two-letter abbreviations. Plan names must use the full format Plan 1477. Exact numeric values use the same min and max. Do not infer fields the user did not mention." },
        { role: "user", content: message },
      ],
      response_format: { type: "json_object" },
    }) as { response?: string };
    const parsed = JSON.parse(response.response ?? "{}") as PlanFilters;
    return normalizeParsedFilters({ ...fallback, ...parsed, states: parsed.states?.length ? parsed.states : fallback.states });
  } catch {
    return fallback;
  }
}
