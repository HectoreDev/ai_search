import { chat, chatParamsFromRequestBody, toServerSentEventsResponse, toolDefinition } from "@tanstack/ai";
import { createGeminiChat } from "@tanstack/ai-gemini";
import { Hono } from "hono";
import { z } from "zod";
import { normalizeParsedFilters, parseWithAI } from "../lib/parser";
import { searchPlans } from "../lib/search";
import { parseRequestSchema } from "../schemas";
import type { Bindings } from "../types";
import { PRODUCT_TYPES } from "../types";

export const chatRoutes = new Hono<{ Bindings: Bindings }>();

const aiFiltersSchema = z.object({
  name: z.string().optional(),
  storiesMin: z.number().nonnegative().optional(), storiesMax: z.number().nonnegative().optional(),
  sqftMin: z.number().nonnegative().optional(), sqftMax: z.number().nonnegative().optional(),
  bedsMin: z.number().nonnegative().optional(), bedsMax: z.number().nonnegative().optional(),
  bathsMin: z.number().nonnegative().optional(), bathsMax: z.number().nonnegative().optional(),
  garagesMin: z.number().nonnegative().optional(), garagesMax: z.number().nonnegative().optional(),
  productWidthMin: z.number().nonnegative().optional(), productWidthMax: z.number().nonnegative().optional(),
  productDepthMin: z.number().nonnegative().optional(), productDepthMax: z.number().nonnegative().optional(),
  productTypes: z.array(z.enum(PRODUCT_TYPES)).max(PRODUCT_TYPES.length).optional(),
  division: z.string().trim().max(120).optional(),
  states: z.array(z.string().length(2)).optional(),
});

chatRoutes.post("/", async (c) => {
  if (!c.env.GEMINI_API_KEY) return c.json({ error: "GEMINI_API_KEY is not configured" }, 500);
  const params = await chatParamsFromRequestBody(await c.req.json());
  const searchTool = toolDefinition({
    name: "search_floor_plans",
    description: "Search and rank the D1 floor-plan catalog. Extract plan name, stories, square feet, bedrooms, bathrooms, garages, product width, product depth, product types, division, and states. Supported product types are SFD Detached, Front Load, Alley Load, and TH. Call this exactly once after extracting all preferences. Exact numeric values must use the same min and max. Plan names must use the full catalog format, for example 'Plan 1477', never only '1477'. US states must use two-letter abbreviations. Do not infer filters the user did not provide.",
    inputSchema: aiFiltersSchema,
  }).server(async (filters) => {
    const normalizedFilters = normalizeParsedFilters(filters);
    return {
      filters: normalizedFilters,
      results: await searchPlans(c.env.kb_home_ia, normalizedFilters, 1, 12),
    };
  });
  const stream = chat({
    adapter: createGeminiChat((c.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite") as "gemini-3.1-flash-lite", c.env.GEMINI_API_KEY),
    messages: params.messages,
    tools: [searchTool],
    systemPrompts: [
      "You are Planfinder, a concise bilingual floor-plan search assistant.",
      "Always use search_floor_plans for a floor-plan request. Never invent results or plan attributes.",
      "Treat user criteria as ranking preferences, not strict requirements. Explain that the closest available matches are shown first.",
      "Location is the only strict requirement: when one or more states are requested, results must come from those states.",
      "Normalize product type to exactly one or more of: SFD Detached, Front Load, Alley Load, TH.",
      "Product width and product depth are measured in feet. Preserve explicit ranges and do not guess missing dimensions.",
      "Understand Spanish and English. Correct obvious state misspellings such as whasshington to Washington (WA).",
      "After the tool completes, briefly tell the user how many matches were found. Do not list every result because the UI renders them.",
    ],
  });
  return toServerSentEventsResponse(stream);
});

chatRoutes.post("/parse", async (c) => {
  const body = parseRequestSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid message" }, 400);
  const filters = await parseWithAI(c.env.AI, body.data.message);
  const results = await searchPlans(c.env.kb_home_ia, filters, 1, 12);
  return c.json({ filters, results });
});
