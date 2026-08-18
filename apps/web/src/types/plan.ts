export type Filters = {
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
  productTypes?: Array<"SFD Detached" | "Front Load" | "Alley Load" | "TH">;
  division?: string;
  divisions?: string[];
  states?: string[];
};

export type Plan = {
  uid: string;
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
  states: string[];
  statuses: string[];
  communities: string[];
  match_score: number;
};

export type SearchResponse = {
  items: Plan[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const emptyResults: SearchResponse = {
  items: [], total: 0, page: 1, pageSize: 12, totalPages: 1,
};
