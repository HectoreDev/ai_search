import styles from "./RangeFilter.module.css";
export function RangeFilter({ label, min, max, onMin, onMax }: { label: string; min?: number; max?: number; onMin: (value: string) => void; onMax: (value: string) => void }) {
  return <fieldset className={styles.field}><legend>{label}</legend><div className={styles.range}>
    <input type="number" placeholder="Min" value={min ?? ""} onChange={(event) => onMin(event.target.value)} />
    <input type="number" placeholder="Max" value={max ?? ""} onChange={(event) => onMax(event.target.value)} />
  </div></fieldset>;
}
