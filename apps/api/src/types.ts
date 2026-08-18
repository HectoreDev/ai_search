export type Bindings = {
  kb_home_ia: D1Database;
  AI?: Ai;
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
};

export const PRODUCT_TYPES = ["SFD Detached", "Front Load", "Alley Load", "TH"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];
export const PLAN_STATUSES = ["active", "archived"] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];
export const VIEW_MODES = ["elevations", "floorPlans"] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export type PlanFilters = {
  query?: string;
  name?: string;
  storiesMin?: number;
  storiesMax?: number;
  sqftMin?: number;
  sqftMax?: number;
  bedsMin?: number;
  bedsMax?: number;
  bathsMin?: number;
  bathsMax?: number;
  garagesMin?: number;
  garagesMax?: number;
  productWidthMin?: number;
  productWidthMax?: number;
  productDepthMin?: number;
  productDepthMax?: number;
  productTypes?: ProductType[];
  division?: string;
  divisions?: string[];
  statuses?: PlanStatus[];
  viewMode?: ViewMode;
  states?: string[];
};

export type PlanRow = {
  uid: string;
  floor_plan_uid: string | null;
  name: string;
  bedrooms_min: number;
  bedrooms_max: number;
  bathrooms_min: number;
  bathroom_max: number;
  garage_min: number;
  garage_max: number;
  level_min: number;
  level_max: number;
  sqft_min: number;
  sqft_max: number;
  price: number;
  img_src: string | null;
  basegroup_url: string | null;
  elevation_count: number | null;
  states: string;
  statuses: string;
  communities: string;
  match_score: number;
};
