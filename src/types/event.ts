export interface ConEvent {
  id: string;
  title: string;
  /** Start date (YYYY-MM-DD) */
  date: string;
  /** End date for multi-day cons (YYYY-MM-DD). Defaults to start date when omitted. */
  endDate?: string;
  location?: string;
  description?: string;
}
