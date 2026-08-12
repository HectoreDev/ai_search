import { useEffect, useRef, useState } from "react";
import styles from "./StateMultiSelect.module.css";

const options = [
  ["AZ", "Arizona"], ["CA", "California"], ["CO", "Colorado"], ["FL", "Florida"],
  ["ID", "Idaho"], ["NV", "Nevada"], ["NC", "North Carolina"], ["TX", "Texas"], ["WA", "Washington"],
] as const;

export function StateMultiSelect({ value, onChange }: { value: string[]; onChange: (states: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const toggle = (code: string) => onChange(value.includes(code) ? value.filter((state) => state !== code) : [...value, code]);
  return <fieldset className={`${styles.field} ${open ? styles.open : ""}`}><legend>State</legend>
    <div ref={rootRef} className={styles.root}>
      <div className={styles.control} onClick={() => setOpen((current) => !current)}>
        <div className={styles.chips}>{value.length ? value.map((code) => <button key={code} type="button" className={styles.chip} onClick={(event) => { event.stopPropagation(); toggle(code); }}>{options.find(([key]) => key === code)?.[1] ?? code}<span>×</span></button>) : <span className={styles.placeholder}>All states</span>}</div>
        {value.length > 0 && <button type="button" className={styles.clear} aria-label="Clear selected states" onClick={(event) => { event.stopPropagation(); onChange([]); }}>×</button>}
        <span className={styles.chevron}>{open ? "▴" : "▾"}</span>
      </div>
      {open && <div className={styles.menu}>{options.map(([code, name]) => <button type="button" className={value.includes(code) ? styles.selected : ""} key={code} onClick={() => toggle(code)}>{name}</button>)}</div>}
    </div>
  </fieldset>;
}
