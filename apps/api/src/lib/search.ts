import type { PlanFilters, PlanRow } from "../types";

const WEIGHTS = {
  name: 30,
  beds: 8,
  baths: 5,
  sqft: 7,
  garages: 3,
  stories: 2,
};

export async function searchPlans(db: D1Database, filters: PlanFilters, page = 1, pageSize = 12) {
  const scoreParts: string[] = ["0"];
  const values: unknown[] = [];
  const filtersSql: string[] = [];
  const filterValues: unknown[] = [];

  const rawName = (filters.name || filters.query)?.trim();
  const requestedName = rawName && /^\d+$/.test(rawName) ? `Plan ${rawName}` : rawName;
  if (requestedName) {
    const planNumber = Number(requestedName.match(/\d+/)?.[0]);
    if (Number.isFinite(planNumber)) {
      scoreParts.push(`CASE
        WHEN LOWER(TRIM(p.name)) = LOWER(TRIM(?)) THEN ${WEIGHTS.name}
        WHEN LOWER(p.name) LIKE LOWER(?) THEN ${WEIGHTS.name * 0.9}
        ELSE MAX(0, ${WEIGHTS.name * 0.7} - ABS(CAST(REPLACE(LOWER(p.name), 'plan ', '') AS INTEGER) - ?) / 5.0)
      END`);
      values.push(requestedName, `%${requestedName}%`, planNumber);
    } else {
      scoreParts.push(`CASE WHEN LOWER(TRIM(p.name)) = LOWER(TRIM(?)) THEN ${WEIGHTS.name}
        WHEN LOWER(p.name) LIKE LOWER(?) THEN ${WEIGHTS.name * 0.7} ELSE 0 END`);
      values.push(requestedName, `%${requestedName}%`);
    }
  }

  if (filters.states?.length) {
    filtersSql.push(`EXISTS (
      SELECT 1 FROM community_plan cps
      JOIN communities cms ON cms.community_uid = cps.community_uid
      JOIN cities cis ON cis.id = cms.city_id
      JOIN states sts ON sts.id = cis.state_id
      WHERE cps.plan_uid = p.uid AND sts.abbreviation IN (${filters.states.map(() => "?").join(",")})
    )`);
    filterValues.push(...filters.states.map((state) => state.toUpperCase()));
  }

  if (filters.statuses?.length) {
    filtersSql.push(`EXISTS (
      SELECT 1 FROM community_plan cpf
      JOIN communities cmf ON cmf.community_uid = cpf.community_uid
      JOIN community_statuses csf ON csf.id = cmf.status_id
      WHERE cpf.plan_uid = p.uid AND LOWER(csf.name) IN (${filters.statuses.map(() => "?").join(",")})
    )`);
    filterValues.push(...filters.statuses);
  }

  addHardRangeScore(scoreParts, values, "p.bedrooms_min", "p.bedrooms_max", filters.bedsMin ?? filters.bedsMax, WEIGHTS.beds);
  addMediumRangeScore(scoreParts, values, "p.bathrooms_min", "p.bathroom_max", filters.bathsMin ?? filters.bathsMax, WEIGHTS.baths, 3);
  addMediumRangeScore(scoreParts, values, "p.sqft_min", "p.sqft_max", filters.sqftMin ?? filters.sqftMax, WEIGHTS.sqft, 300);
  addMediumRangeScore(scoreParts, values, "p.garage_min", "p.garage_max", filters.garagesMin ?? filters.garagesMax, WEIGHTS.garages, 3);
  addHardRangeScore(scoreParts, values, "p.level_min", "p.level_max", filters.storiesMin ?? filters.storiesMax, WEIGHTS.stories);

  const scoreSql = scoreParts.map((part) => `(${part})`).join(" + ");
  const whereSql = filtersSql.length ? `WHERE ${filtersSql.join(" AND ")}` : "";
  const offset = (page - 1) * pageSize;
  const result = await db.prepare(`WITH ranked AS (
      SELECT p.*, (${scoreSql}) match_score, COUNT(*) OVER () total_count
      FROM plans p
      ${whereSql}
    ), selected AS (
      SELECT * FROM ranked
      ORDER BY match_score DESC, name COLLATE NOCASE ASC
      LIMIT ? OFFSET ?
    )
    SELECT selected.*,
      COALESCE(GROUP_CONCAT(DISTINCT s.abbreviation), '') states,
      COALESCE(GROUP_CONCAT(DISTINCT cs.name), '') statuses,
      COALESCE(GROUP_CONCAT(DISTINCT c.community_name), '') communities
    FROM selected
    LEFT JOIN community_plan cp ON cp.plan_uid = selected.uid
    LEFT JOIN communities c ON c.community_uid = cp.community_uid
    LEFT JOIN cities ci ON ci.id = c.city_id
    LEFT JOIN states s ON s.id = ci.state_id
    LEFT JOIN community_statuses cs ON cs.id = c.status_id
    GROUP BY selected.uid
    ORDER BY selected.match_score DESC, selected.name COLLATE NOCASE ASC`)
    .bind(...values, ...filterValues, pageSize, offset).all<PlanRow>();

  const rows = result.results as Array<PlanRow & { total_count: number }>;
  const total = rows[0]?.total_count ?? 0;

  return {
    items: rows.map(({ total_count: _totalCount, ...row }) => ({
      ...row,
      states: row.states ? row.states.split(",") : [],
      statuses: row.statuses ? row.statuses.split(",") : [],
      communities: row.communities ? row.communities.split(",") : [],
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

function addHardRangeScore(parts: string[], values: unknown[], min: string, max: string, target: number | undefined, weight: number) {
  if (target === undefined) return;
  parts.push(`CASE
    WHEN ? <= COALESCE(${max}, ${min}, 0) AND COALESCE(${min}, 0) <= ? THEN ${weight}
    WHEN MIN(ABS(? - COALESCE(${min}, 0)), ABS(? - COALESCE(${max}, ${min}, 0))) = 1 THEN ${weight * 0.35}
    ELSE ${-weight} END`);
  values.push(target, target, target, target);
}

function addMediumRangeScore(parts: string[], values: unknown[], min: string, max: string, target: number | undefined, weight: number, tolerance: number) {
  if (target === undefined) return;
  parts.push(`MAX(0, 1 - (CAST(CASE
    WHEN ? <= COALESCE(${max}, ${min}, 0) AND COALESCE(${min}, 0) <= ? THEN 0
    WHEN ? < COALESCE(${min}, 0) THEN COALESCE(${min}, 0) - ?
    ELSE ? - COALESCE(${max}, ${min}, 0) END AS REAL) / ${tolerance})) * ${weight}`);
  values.push(target, target, target, target, target);
}
