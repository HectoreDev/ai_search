import { useState } from "react";
import styles from "./JsonViewer.module.css";
export function JsonViewer({ data }: { data: unknown }) {
  const [copied, setCopied] = useState(false);
  if (!data) return null;
  const json = JSON.stringify(data, null, 2);
  async function copy() { await navigator.clipboard.writeText(json); setCopied(true); window.setTimeout(() => setCopied(false), 1400); }
  return <details className={styles.viewer}><summary><span><b>{"{ }"}</b> Search JSON response</span><small>View data</small></summary><div className={styles.toolbar}><span>Response received from the backend</span><button type="button" onClick={() => void copy()}>{copied ? "Copied" : "Copy JSON"}</button></div><pre><code>{json}</code></pre></details>;
}
