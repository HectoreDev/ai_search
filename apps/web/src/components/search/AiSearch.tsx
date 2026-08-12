import type { FormEvent } from "react";
import styles from "./AiSearch.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  loading: boolean;
  response: string;
  error?: string;
};

const example = "I want plan 1765 with 3 bedrooms, 2 bathrooms, 2500 sqft and 2 stories in Nevada and Washington";

export function AiSearch({ value, onChange, onSubmit, loading, response, error }: Props) {
  function submit(event: FormEvent) { event.preventDefault(); void onSubmit(); }
  return <section className={styles.hero}>
    <form className={styles.box} onSubmit={submit}>
      <div className={styles.spark}>✦</div>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} aria-label="Describe the floor plan you are looking for" placeholder="Ask AI: I want plan 2015 with 3 beds, 2 baths, 2500 sqft and 2 stories in Nevada and Washington..." />
      <button disabled={loading} aria-label="Search">Search</button>
    </form>
    <button type="button" className={styles.example} onClick={() => onChange(example)}><span>Try:</span> {example}</button>
    {(loading || response || error) && <div className={styles.notice}>
      {loading && !response ? "Understanding your search…" : response || error}
      {loading && response && <span className={styles.cursor} />}
    </div>}
  </section>;
}
