import { z } from "zod";
import { GARAGE_TYPES, PLAN_STATUSES, PRODUCT_TYPES, VIEW_MODES } from "./types";

const optionalNumber = z.coerce.number().finite().nonnegative().optional();

export const filtersSchema = z.object({
  query: z.string().trim().max(120).optional(),
  name: z.string().trim().max(120).optional(),
  storiesMin: optionalNumber,
  storiesMax: optionalNumber,
  sqftMin: optionalNumber,
  sqftMax: optionalNumber,
  bedsMin: optionalNumber,
  bedsMax: optionalNumber,
  bathsMin: optionalNumber,
  bathsMax: optionalNumber,
  garagesMin: optionalNumber,
  garagesMax: optionalNumber,
  productWidthMin: optionalNumber,
  productWidthMax: optionalNumber,
  productDepthMin: optionalNumber,
  productDepthMax: optionalNumber,
  productTypes: z.array(z.enum(PRODUCT_TYPES)).max(PRODUCT_TYPES.length).optional(),
  garageTypes: z.array(z.enum(GARAGE_TYPES)).max(GARAGE_TYPES.length).optional(),
  division: z.string().trim().max(120).optional(),
  divisions: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  statuses: z.array(z.enum(PLAN_STATUSES)).max(PLAN_STATUSES.length).optional(),
  viewMode: z.enum(VIEW_MODES).optional(),
  states: z.array(z.string().trim().min(2).max(32)).max(20).optional(),
});

export const planSchema = z.object({
  uid: z.string().trim().min(1).max(100),
  floorPlanUid: z.string().trim().max(100).nullish(),
  communityUid: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(160),
  bedroomsMin: optionalNumber.default(0), bedroomsMax: optionalNumber.default(0),
  bathroomsMin: optionalNumber.default(0), bathroomsMax: optionalNumber.default(0),
  garageMin: optionalNumber.default(0), garageMax: optionalNumber.default(0),
  levelMin: optionalNumber.default(0), levelMax: optionalNumber.default(0),
  sqftMin: optionalNumber.default(0), sqftMax: optionalNumber.default(0),
  price: optionalNumber.default(0),
  imgSrc: z.string().url().nullish().or(z.literal("")),
  basegroupUrl: z.string().url().nullish().or(z.literal("")),
  elevationCount: z.coerce.number().int().nonnegative().nullish(),
});

export const importSchema = z.object({ plans: z.array(planSchema).min(1).max(500) });

export const parseRequestSchema = z.object({ message: z.string().trim().min(2).max(1000) });
