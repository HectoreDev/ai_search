import { GARAGE_TYPES, PLAN_STATUSES, PRODUCT_TYPES, type GarageType, type PlanFilters, type PlanStatus, type ProductType, type ViewMode } from "../types";

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

function rangeBefore(text: string, terms: string[]) {
  const pattern = terms.join("|");
  const range = text.match(new RegExp(`([\\d,.]+)\\s*(?:to|through|-|a|hasta)\\s*([\\d,.]+)\\s*(?:${pattern})`, "i"));
  if (range) return [Number(range[1].replace(/,/g, "")), Number(range[2].replace(/,/g, ""))] as const;
  const exact = numberBefore(text, terms);
  return [exact, exact] as const;
}

function dimensionRange(text: string, name: "width" | "depth") {
  const aliases = name === "width" ? "width|wide|ancho" : "depth|deep|profundidad|fondo";
  const range = text.match(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(?:to|through|-|a|hasta)\\s*(\\d+(?:[.,]\\d+)?)\\s*(?:ft|feet|foot|pies?|')?\\s*(?:${aliases})`, "i"));
  if (range) return [Number(range[1].replace(",", ".")), Number(range[2].replace(",", "."))] as const;
  const afterLabel = text.match(new RegExp(`(?:product\\s+)?(?:${aliases})\\s*(?:of|de|:|=)?\\s*(\\d+(?:[.,]\\d+)?)`, "i"));
  const beforeLabel = text.match(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(?:ft|feet|foot|pies?|')?\\s*(?:${aliases})`, "i"));
  const value = afterLabel?.[1] ?? beforeLabel?.[1];
  const exact = value ? Number(value.replace(",", ".")) : undefined;
  return [exact, exact] as const;
}

function parseProductTypes(text: string): ProductType[] {
  const types: ProductType[] = [];
  const add = (type: ProductType) => { if (!types.includes(type)) types.push(type); };
  if (/\b(?:single[-\s]?family(?:\s+home)?|sfd|casa\s+unifamiliar)\b/i.test(text)) add("Single Family Home");
  if (/\b(?:townhome|townhomes|town\s*house|town\s*houses|th|casa\s+adosada)\b/i.test(text)) add("Townhome");
  if (/\b(?:multi[-\s]?family|multifamily|vivienda\s+multifamiliar)\b/i.test(text)) add("Multi-Family");
  if (/\b(?:duet|duets)\b/i.test(text)) add("Duet");
  return types;
}

function normalizeProductType(value: string): ProductType | undefined {
  const normalized = value.trim().toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");
  if (/^(?:single family|single family home|sfd)$/.test(normalized)) return "Single Family Home";
  if (/^(?:townhome|townhomes|town house|townhouse|th)$/.test(normalized)) return "Townhome";
  if (/^(?:multi family|multifamily)$/.test(normalized)) return "Multi-Family";
  if (/^duets?$/.test(normalized)) return "Duet";
  return PRODUCT_TYPES.find((type) => type.toLowerCase() === normalized);
}

function parseGarageTypes(text: string): GarageType[] {
  const types: GarageType[] = [];
  const add = (type: GarageType) => { if (!types.includes(type)) types.push(type); };
  const requestedList = text.match(/\bgarage\s+types?\s*(?:is|are|of|:|=)?\s*([^,.;]+?)(?=\s+(?:with|in|for|and\s+show|that)\b|[,.;]|$)/i)?.[1] ?? "";
  const garageContext = `${text} ${requestedList}`;
  if (/\b(?:front(?:[-\s]?load(?:ed)?)?\s+garage|garage\s+(?:type\s+)?front|garaje\s+frontal)\b/i.test(text) || /\bfront\b/i.test(requestedList)) add("Front");
  if (/\b(?:rear(?:[-\s]?load(?:ed)?)?\s+garage|garage\s+(?:type\s+)?rear|garaje\s+trasero)\b/i.test(text) || /\brear\b/i.test(requestedList)) add("Rear");
  if (/\b(?:side(?:[-\s]?load(?:ed)?)?\s+garage|garage\s+(?:type\s+)?side|garaje\s+lateral)\b/i.test(text) || /\bside\b/i.test(requestedList)) add("Side");
  if (/\b(?:detached\s+garage|garage\s+(?:type\s+)?detached|garaje\s+separado)\b/i.test(garageContext)) add("Detached");
  return types;
}

function normalizeGarageType(value: string): GarageType | undefined {
  const normalized = value.trim().toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");
  if (/^front(?: load(?:ed)?)?$/.test(normalized)) return "Front";
  if (/^rear(?: load(?:ed)?)?$/.test(normalized)) return "Rear";
  if (/^side(?: load(?:ed)?)?$/.test(normalized)) return "Side";
  if (/^detached$/.test(normalized)) return "Detached";
  return GARAGE_TYPES.find((type) => type.toLowerCase() === normalized);
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseDivisions(text: string): string[] {
  const list = text.match(
    /\b(?:in|within|for|en)\s+(?:the|las?|los)?\s*([a-z0-9][a-z0-9 &'/-]*?)\s+divisions?\b/i,
  )?.[1];
  const singular = text.match(
    /\bdivision\s*(?:is|of|es|de|:|=)?\s*([a-z0-9][a-z0-9 &'/-]{1,60}?)(?=\s+(?:with|in|and|that|having|con|en|y|que)\b|[,.;]|$)/i,
  )?.[1];

  return [...new Set((list ? list.split(/\s*(?:,|\band\b|\bor\b|\by\b|\bo\b)\s*/i) : singular ? [singular] : [])
    .map((division) => division.trim().replace(/^(?:the|la|el)\s+/i, ""))
    .filter(Boolean)
    .map(titleCase))];
}

export function normalizeParsedFilters(filters: PlanFilters): PlanFilters {
  const productTypes = [...new Set((filters.productTypes ?? []).map(normalizeProductType).filter((type): type is ProductType => Boolean(type)))];
  const garageTypes = [...new Set((filters.garageTypes ?? []).map(normalizeGarageType).filter((type): type is GarageType => Boolean(type)))];
  const states = [...new Set((filters.states ?? []).map((state) => state.trim().toUpperCase()).filter(Boolean))];
  const statuses = [...new Set((filters.statuses ?? []).map((status) => status.trim().toLowerCase()).filter((status): status is PlanStatus => PLAN_STATUSES.includes(status as PlanStatus)))];
  const divisions = [...new Set([
    ...(filters.divisions ?? []),
    ...(filters.division ? [filters.division] : []),
  ].map((division) => division.trim()).filter(Boolean))];
  return {
    ...filters,
    name: filters.name && /^\d+$/.test(filters.name.trim()) ? `Plan ${filters.name.trim()}` : filters.name,
    division: undefined,
    divisions,
    productTypes,
    garageTypes,
    statuses,
    states,
  };
}

export function parseLocally(message: string): PlanFilters {
  const normalized = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const [bedsMin, bedsMax] = rangeBefore(normalized, ["recamaras?", "habitaciones?", "dormitorios?", "beds?", "bedrooms?"]);
  const [bathsMin, bathsMax] = rangeBefore(normalized, ["banos?", "baths?", "bathrooms?"]);
  const [garagesMin, garagesMax] = rangeBefore(normalized, ["garajes?", "cocheras?", "garages?", "cars?"]);
  const [storiesMin, storiesMax] = rangeBefore(normalized, ["niveles?", "pisos?", "plantas?", "stories?"]);
  const [productWidthMin, productWidthMax] = dimensionRange(normalized, "width");
  const [productDepthMin, productDepthMax] = dimensionRange(normalized, "depth");
  const productTypes = parseProductTypes(normalized);
  const garageTypes = parseGarageTypes(normalized);
  const divisions = parseDivisions(normalized);
  const [sqftMin, sqftMax] = rangeBefore(normalized, ["square\\s+feet", "sq\\.?\\s*ft", "sqft", "pies?\\s+cuadrados?"]);
  const states = Object.entries(STATE_NAMES)
    .filter(([name]) => new RegExp(`\\b${name}\\b`, "i").test(normalized))
    .map(([, abbreviation]) => abbreviation);
  const explicitCodes = normalized.match(/\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/gi) ?? [];
  const planName = normalized.match(/(?:plan|plano|modelo)\s+([a-z0-9][a-z0-9-]*)/i)?.[1];
  const statuses: PlanStatus[] = [];
  if (/\b(?:active|activo|activa)\b/i.test(normalized)) statuses.push("active");
  if (/\b(?:archived|archive|archivado|archivada)\b/i.test(normalized)) statuses.push("archived");
  const viewMode: ViewMode | undefined = /\b(?:elevations?|elevaciones?|fachadas?)\b/i.test(normalized)
    ? "elevations"
    : /\b(?:viewer\s+plan|floor\s*plans?|plan\s+viewer|ver\s+planos?)\b/i.test(normalized) ? "floorPlans" : undefined;

  return normalizeParsedFilters({
    name: planName ? `Plan ${planName}` : undefined,
    bedsMin, bedsMax,
    bathsMin, bathsMax,
    garagesMin, garagesMax,
    productWidthMin, productWidthMax,
    productDepthMin, productDepthMax,
    productTypes,
    garageTypes,
    divisions,
    storiesMin, storiesMax,
    sqftMin, sqftMax,
    statuses,
    viewMode,
    states: [...new Set([...states, ...explicitCodes.map((code) => code.toUpperCase())])],
  });
}

export async function parseWithAI(ai: Ai | undefined, message: string): Promise<PlanFilters> {
  const fallback = parseLocally(message);
  if (!ai) return fallback;

  try {
    const response = await ai.run("@cf/meta/llama-3.1-8b-instruct-fast", {
      messages: [
        { role: "system", content: "Extract floor-plan search filters. Return only JSON with optional keys: name, storiesMin, storiesMax, sqftMin, sqftMax, bedsMin, bedsMax, bathsMin, bathsMax, garagesMin, garagesMax, productWidthMin, productWidthMax, productDepthMin, productDepthMax, productTypes, garageTypes, divisions, statuses, viewMode, states. productTypes must contain only: Single Family Home, Townhome, Multi-Family, Duet. garageTypes must contain only: Front, Rear, Side, Detached. Keep productTypes and garageTypes separate. divisions must contain every requested division name. statuses must contain only lowercase active or archived. viewMode must be elevations or floorPlans; viewer plan means floorPlans. states must contain US two-letter abbreviations. Preserve explicit numeric ranges. Plan names must use the full format Plan 1477. Exact numeric values use the same min and max. Do not infer fields the user did not mention." },
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
