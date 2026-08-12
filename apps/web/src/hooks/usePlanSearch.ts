import { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from "../lib/api";
import { emptyResults, type Filters, type SearchResponse } from "../types/plan";

const numericKeys = new Set<keyof Filters>([
  "storiesMin", "storiesMax", "sqftMin", "sqftMax", "bedsMin", "bedsMax",
  "bathsMin", "bathsMax", "garagesMin", "garagesMax", "productWidthMin",
  "productWidthMax", "productDepthMin", "productDepthMax",
]);

export function usePlanSearch() {
  const [filters, setFilters] = useState<Filters>({});
  const [results, setResults] = useState<SearchResponse>(emptyResults);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [searchJson, setSearchJson] = useState<unknown>(null);

  const search = useCallback(async (next: Filters = filters, page = 1) => {
    setLoading(true);
    setNotice("");
    const params = new URLSearchParams({ page: String(page), pageSize: "12" });
    Object.entries(next).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && (!Array.isArray(value) || value.length)) {
        params.set(key, Array.isArray(value) ? value.join(",") : String(value));
      }
    });
    try {
      const response = await fetch(apiUrl(`/api/plans?${params}`));
      if (!response.ok) throw new Error("Unable to search floor plans");
      const data = await response.json() as SearchResponse;
      setResults(data);
      setSearchJson({ source: "GET /api/plans", receivedAt: new Date().toISOString(), filters: next, response: data });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void search({}); }, []); // Initial catalog load only.

  const updateFilter = useCallback((key: keyof Filters, value: string | string[]) => {
    setFilters((current) => ({
      ...current,
      [key]: Array.isArray(value) ? value : numericKeys.has(key) ? (value === "" ? undefined : Number(value)) : value || undefined,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    void search({});
  }, [search]);

  const activeCount = useMemo(() => Object.values(filters).filter(
    (value) => value !== undefined && value !== "" && (!Array.isArray(value) || value.length),
  ).length, [filters]);

  return { filters, setFilters, results, setResults, loading, notice, setNotice, searchJson, setSearchJson, search, updateFilter, clearFilters, activeCount };
}
