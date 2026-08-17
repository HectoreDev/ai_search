import { chat, chatParamsFromRequestBody, toServerSentEventsResponse, toolDefinition } from "@tanstack/ai";
import { createGeminiChat } from "@tanstack/ai-gemini";
import { Hono } from "hono";
import { z } from "zod";
import { normalizeParsedFilters, parseWithAI } from "../lib/parser";
import { parseRequestSchema } from "../schemas";
import type { Bindings } from "../types";
import { PLAN_STATUSES, PRODUCT_TYPES, VIEW_MODES } from "../types";

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
  statuses: z.array(z.enum(PLAN_STATUSES)).max(PLAN_STATUSES.length).optional(),
  viewMode: z.enum(VIEW_MODES).optional(),
  states: z.array(z.string().length(2)).optional(),
});

chatRoutes.post("/", async (c) => {
  if (!c.env.GEMINI_API_KEY) return c.json({ error: "GEMINI_API_KEY is not configured" }, 500);
  const params = await chatParamsFromRequestBody(await c.req.json());
  const parseTool = toolDefinition({
    name: "parse_floor_plan_filters",
    description: "Parse floor-plan preferences without searching the database. Extract plan name, stories, square feet, bedrooms, bathrooms, garages, product width, product depth, product types, division, community statuses, states, and viewMode. Use statuses for active or archived status. viewMode must be elevations when the user wants elevation images, or floorPlans when the user says viewer plan, floor plan view, or wants floor-plan drawings. Supported product types are SFD Detached, Front Load, Alley Load, and TH. Call this exactly once after extracting all preferences. Preserve explicit numeric ranges in their Min and Max fields. Exact numeric values must use the same min and max. Plan names must use the full catalog format, for example 'Plan 1477', never only '1477'. US states must use two-letter abbreviations. Do not infer filters the user did not provide.",
    inputSchema: aiFiltersSchema,
  }).server(async (filters) => ({ filters: normalizeParsedFilters(filters) }));
  const stream = chat({
    adapter: createGeminiChat((c.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite") as "gemini-3.1-flash-lite", c.env.GEMINI_API_KEY),
    messages: params.messages,
    tools: [parseTool],
    systemPrompts: [
      "You are Planfinder, a concise floor-plan search assistant. Always respond to the user in English only, even when the user writes in Spanish or another language.",
      "Always use parse_floor_plan_filters for a floor-plan request.",
      "Only parse preferences. Never claim that a database search ran, never claim matches were found, and never invent results.",
      "Normalize product type to exactly one or more of: SFD Detached, Front Load, Alley Load, TH.",
      "Product width and product depth are measured in feet. Preserve explicit ranges and do not guess missing dimensions.",
      "Extract requested community status into statuses. The only valid values are lowercase active and archived.",
      "Extract display preference into viewMode: elevations for elevation images, floorPlans for viewer plan or floor-plan drawings.",
      "Understand search requests written in Spanish or English, but never write the assistant response in Spanish. Correct obvious state misspellings such as whasshington to Washington (WA).",
      "After the tool completes, briefly tell the user that the filters are ready and they can apply them to search.",
    ],
  });
  return toServerSentEventsResponse(stream);
});

chatRoutes.post("/parse", async (c) => {
  const body = parseRequestSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid message" }, 400);
  const filters = await parseWithAI(c.env.AI, body.data.message);
  return c.json({ filters });
});
