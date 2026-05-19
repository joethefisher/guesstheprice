// Listings older than this are excluded from gameplay — sold prices feel stale to
// users as the market drifts upward. Keep ingestion in sync with this window.
export const RECENCY_CUTOFF_MONTHS = 24;

export function recencyCutoffDate(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - RECENCY_CUTOFF_MONTHS);
  return d;
}
