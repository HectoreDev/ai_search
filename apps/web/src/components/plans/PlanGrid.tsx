import { useMemo } from "react";
import type { Plan } from "../../types/plan";
import { PlanCard } from "./PlanCard";
import styles from "./PlanGrid.module.css";

export function PlanGrid({ plans, loading }: { plans: Plan[]; loading: boolean }) {
  const highest = useMemo(() => Math.max(0, ...plans.map((plan) => Number(plan.match_score) || 0)), [plans]);
  if (loading) return <div className={styles.empty}>Finding the best floor plans…</div>;
  if (!plans.length) return <div className={styles.empty}><b>No matches found.</b><span>Try broadening one of the ranges.</span></div>;
  return <div className={styles.grid}>{plans.map((plan) => <PlanCard key={plan.uid} plan={plan} highlighted={highest > 0 && Number(plan.match_score) === highest} />)}</div>;
}
