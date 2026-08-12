import type { Filters } from "../../types/plan";
import { RangeFilter } from "./RangeFilter";
import { StateMultiSelect } from "./StateMultiSelect";
import styles from "./PlanFilters.module.css";

type Props = { filters: Filters; activeCount: number; onUpdate: (key: keyof Filters, value: string | string[]) => void; onApply: () => void; onClear: () => void };
export function PlanFilters({ filters, activeCount, onUpdate, onApply, onClear }: Props) {
  return <aside className={styles.filters}>
    <div className={styles.heading}><h2>Filter plans</h2>{activeCount > 0 && <span className={styles.count}>{activeCount}</span>}</div>
    <label className={styles.label}>Floor plan<input placeholder="Search Floor Plan..." value={filters.name ?? ""} onChange={(event) => onUpdate("name", event.target.value)} /></label>
    <RangeFilter label="Stories" min={filters.storiesMin} max={filters.storiesMax} onMin={(v) => onUpdate("storiesMin", v)} onMax={(v) => onUpdate("storiesMax", v)} />
    <RangeFilter label="Square feet" min={filters.sqftMin} max={filters.sqftMax} onMin={(v) => onUpdate("sqftMin", v)} onMax={(v) => onUpdate("sqftMax", v)} />
    <RangeFilter label="Bedrooms" min={filters.bedsMin} max={filters.bedsMax} onMin={(v) => onUpdate("bedsMin", v)} onMax={(v) => onUpdate("bedsMax", v)} />
    <RangeFilter label="Bathrooms" min={filters.bathsMin} max={filters.bathsMax} onMin={(v) => onUpdate("bathsMin", v)} onMax={(v) => onUpdate("bathsMax", v)} />
    <RangeFilter label="Garages" min={filters.garagesMin} max={filters.garagesMax} onMin={(v) => onUpdate("garagesMin", v)} onMax={(v) => onUpdate("garagesMax", v)} />
    <StateMultiSelect value={filters.states ?? []} onChange={(states) => onUpdate("states", states)} />
    <button className={styles.apply} onClick={onApply}>Apply filters</button>
    <button className={styles.clear} onClick={onClear}>Clear filters</button>
  </aside>;
}
