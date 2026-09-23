import { Hono } from "hono";
import { filtersSchema, importSchema, planSchema } from "../schemas";
import { searchPlans } from "../lib/search";
import type { Bindings } from "../types";

export const plansRoutes = new Hono<{ Bindings: Bindings }>();

plansRoutes.get("/", async (c) => {
  const raw = c.req.query();
  const parsed = filtersSchema.safeParse({
    ...raw,
    states: raw.states ? raw.states.split(",").filter(Boolean) : undefined,
    statuses: raw.statuses ? raw.statuses.split(",").filter(Boolean) : undefined,
    productTypes: raw.productTypes ? raw.productTypes.split(",").filter(Boolean) : undefined,
    garageTypes: raw.garageTypes ? raw.garageTypes.split(",").filter(Boolean) : undefined,
  });
  if (!parsed.success) return c.json({ error: "Invalid filters", details: parsed.error.flatten() }, 400);
  return c.json(await searchPlans(c.env.kb_home_ia, parsed.data, Math.max(1, Number(raw.page) || 1), Math.min(50, Math.max(1, Number(raw.pageSize) || 12))));
});

async function savePlan(db: D1Database, input: ReturnType<typeof planSchema.parse>) {
  const community = await db.prepare("SELECT community_uid FROM communities WHERE community_uid = ?").bind(input.communityUid).first();
  if (!community) throw new Error(`Community ${input.communityUid} does not exist`);
  await db.prepare(`INSERT INTO plans
    (uid, floor_plan_uid, name, bedrooms_min, bedrooms_max, bathrooms_min, bathroom_max,
     garage_min, garage_max, level_min, level_max, sqft_min, sqft_max, price, img_src, basegroup_url, elevation_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(uid) DO UPDATE SET floor_plan_uid=excluded.floor_plan_uid, name=excluded.name,
      bedrooms_min=excluded.bedrooms_min, bedrooms_max=excluded.bedrooms_max,
      bathrooms_min=excluded.bathrooms_min, bathroom_max=excluded.bathroom_max,
      garage_min=excluded.garage_min, garage_max=excluded.garage_max,
      level_min=excluded.level_min, level_max=excluded.level_max,
      sqft_min=excluded.sqft_min, sqft_max=excluded.sqft_max, price=excluded.price,
      img_src=excluded.img_src, basegroup_url=excluded.basegroup_url, elevation_count=excluded.elevation_count`)
    .bind(input.uid, input.floorPlanUid ?? null, input.name, input.bedroomsMin, input.bedroomsMax,
      input.bathroomsMin, input.bathroomsMax, input.garageMin, input.garageMax, input.levelMin,
      input.levelMax, input.sqftMin, input.sqftMax, input.price, input.imgSrc || null,
      input.basegroupUrl || null, input.elevationCount ?? null).run();
  await db.prepare("INSERT OR IGNORE INTO community_plan (community_uid, plan_uid) VALUES (?, ?)").bind(input.communityUid, input.uid).run();
  return input.uid;
}

plansRoutes.post("/", async (c) => {
  const parsed = planSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: "Invalid plan", details: parsed.error.flatten() }, 400);
  try { return c.json({ uid: await savePlan(c.env.kb_home_ia, parsed.data) }, 201); }
  catch (error) { return c.json({ error: error instanceof Error ? error.message : "Could not save plan" }, 400); }
});

plansRoutes.post("/import", async (c) => {
  const parsed = importSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: "Invalid import", details: parsed.error.flatten() }, 400);
  const uids: string[] = [];
  for (const plan of parsed.data.plans) uids.push(await savePlan(c.env.kb_home_ia, plan));
  return c.json({ imported: uids.length, uids }, 201);
});
