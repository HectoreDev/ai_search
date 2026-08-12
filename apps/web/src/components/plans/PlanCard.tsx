import type { Plan } from "../../types/plan";
import styles from "./PlanCard.module.css";

const formatRange = (min: number, max: number) => min === max ? min.toLocaleString() : `${min.toLocaleString()}–${max.toLocaleString()}`;

export function PlanCard({ plan, highlighted }: { plan: Plan; highlighted: boolean }) {
  const specs = [
    [formatRange(plan.bedrooms_min, plan.bedrooms_max), "BED"],
    [formatRange(plan.bathrooms_min, plan.bathroom_max), "BATH"],
    [formatRange(plan.sqft_min, plan.sqft_max), "SQFT"],
    [formatRange(plan.level_min, plan.level_max), "STORY"],
    [formatRange(plan.garage_min, plan.garage_max), "GARAGE"],
  ];
  return <article className={`${styles.card} ${highlighted ? styles.best : ""}`}>
    {highlighted && <span className={styles.badge}>Best match</span>}
    <div className={styles.head}><div><h3>{plan.name}</h3><p>{plan.communities[0] || "KB Home"} · {plan.states.join(", ") || "Available"}</p><span>⌂ {plan.communities.length || 1} community</span></div><i className={styles.status}>{plan.statuses[0] || "Active"}</i></div>
    <div className={styles.image} style={plan.img_src ? { backgroundImage: `url(${plan.img_src})` } : undefined}>{!plan.img_src && <span>{plan.name.slice(0, 1)}</span>}<button className={styles.next} aria-label="Next image">›</button></div>
    <div className={styles.body}><p className={styles.price}>From <strong>{plan.price > 0 ? `$${plan.price.toLocaleString()}` : "Contact us"}</strong></p><dl className={styles.specs}>{specs.map(([value, label]) => <div key={label}><dd>{value}</dd><dt>{label}</dt></div>)}</dl></div>
    <div className={styles.actions}><button>☷ &nbsp; Compare</button><button>⌕ &nbsp; Show plan details</button></div>
  </article>;
}
