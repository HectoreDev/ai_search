import styles from "./Pagination.module.css";
export function Pagination({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (page: number) => void }) {
  return <div className={styles.pagination}><button aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}>‹</button><span>Page {page} of {totalPages} ({total.toLocaleString()} results)</span><button aria-label="Next page" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>›</button></div>;
}
