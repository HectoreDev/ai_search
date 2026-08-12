import { AiSearch } from "./components/search/AiSearch";
import { PlanFilters } from "./components/filters/PlanFilters";
import { JsonViewer } from "./components/debug/JsonViewer";
import { Pagination } from "./components/plans/Pagination";
import { PlanGrid } from "./components/plans/PlanGrid";
import { useAiPlanSearch } from "./hooks/useAiPlanSearch";
import { usePlanSearch } from "./hooks/usePlanSearch";
import styles from "./App.module.css";

export default function App() {
  const catalog = usePlanSearch();
  const ai = useAiPlanSearch({
    onStart: () => catalog.setNotice(""),
    onParsed: (filters, payload) => {
      catalog.setFilters(filters);
      catalog.setSearchJson(payload);
    },
  });

  return <div className={styles.shell}>
    <header className={styles.header}><a className={styles.brand} href="#"><img src="/kblogo.svg" alt="KB Home" /></a></header>
    <main>
      <AiSearch value={ai.prompt} onChange={ai.setPrompt} onSubmit={ai.submit} loading={catalog.loading || ai.isLoading} response={ai.assistantText || catalog.notice} error={ai.error?.message} />
      <section className={styles.workspace}>
        <PlanFilters filters={catalog.filters} activeCount={catalog.activeCount} onUpdate={catalog.updateFilter} onApply={() => void catalog.search()} onClear={catalog.clearFilters} />
        <div className={styles.results}>
          <div className={styles.heading}><div><span>Floor plans</span><h2>{catalog.results.total.toLocaleString()} plans found</h2></div></div>
          <JsonViewer data={catalog.searchJson} />
          <PlanGrid plans={catalog.results.items} loading={catalog.loading} />
          <Pagination page={catalog.results.page} totalPages={catalog.results.totalPages} total={catalog.results.total} onPage={(page) => void catalog.search(catalog.filters, page)} />
        </div>
      </section>
    </main>
  </div>;
}
