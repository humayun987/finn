// ─── Announcements ──────────────────────────────────────────────────────────
export type Category =
  | "results" | "M&A" | "fund_raise" | "management_change" | "litigation"
  | "insider_trading" | "earnings_call" | "investor_meetings" | "credit_rating"
  | "dividend" | "bonus_split" | "capex" | "press_release" | "postal_ballot"
  | "agm_egm" | "pledging" | "unclassified";

export interface Announcement {
  id?: string;
  ticker: string;
  exchange?: string;
  title: string;
  category: Category;
  summary: string;
  priority: number;
  is_material: boolean;
  attachment_url?: string;
  ann_timestamp: string;
  enrichment?: ResultsEnrichment | MgmtEnrichment | MAEnrichment | RatingEnrichment | DividendEnrichment | null;
}

export interface ResultsEnrichment {
  period: string;
  revenue:  Metric;
  ebitda:   Metric;
  ebitda_margin_pct: { current: number|null; prev_quarter: number|null; prev_year: number|null };
  pbt:      Metric;
  pat:      Metric;
  key_highlight?: string;
}

export interface Metric {
  current:      number | null;
  prev_quarter: number | null;
  prev_year:    number | null;
  unit:         string;
  qoq_pct?:    number;
  yoy_pct?:    number;
}

export interface MgmtEnrichment {
  change_type: string;
  role: string;
  person_name: string | null;
  effective_date: string | null;
  incoming_background: string | null;
  outgoing_context: string | null;
}

export interface MAEnrichment {
  deal_type: string;
  target_entity: string | null;
  deal_size_cr: number | null;
  stake_pct: number | null;
  strategic_rationale: string | null;
}

export interface RatingEnrichment {
  agency: string | null;
  instrument: string | null;
  rating: string | null;
  outlook: string | null;
  action: string;
}

export interface DividendEnrichment {
  amount_per_share: number | null;
  dividend_type: string;
  record_date: string | null;
}

// ─── Prices ─────────────────────────────────────────────────────────────────
export interface PriceAlert {
  ticker: string;
  alert_type: "price_move" | "volume_spike";
  value: number;
  direction?: "up" | "down";
  severity: "high" | "medium";
  message: string;
}

export interface StockSnapshot {
  ticker: string;
  price: number;
  change_pct: number;
  week52_high: number;
  week52_low: number;
  sparkline: number[];
}

// ─── Research ────────────────────────────────────────────────────────────────
export interface Research {
  ticker: string;
  company_name: string;
  sector: string;
  status: string;
  data_note?: string;
  business_snapshot: {
    what_they_do: string;
    segments: { name: string; revenue_share_pct: number|null; ebitda_share_pct: number|null }[];
    key_markets: string[];
    moat_claim: string;
  };
  financial_snapshot: {
    revenue_ttm_cr: number | null;
    revenue_cagr_3y_pct: number | null;
    ebitda_margin_pct: number | null;
    ebitda_margin_trend: string;
    pat_ttm_cr: number | null;
    roe_pct: number | null;
    roce_pct: number | null;
    de_ratio: number | null;
    fcf_positive: boolean | null;
    period_note: string;
  };
  trajectory: {
    revenue_trend: string;
    margin_trend: string;
    key_driver: string;
    key_concern: string;
  };
  narrative_vs_numbers: {
    claims: { management_said: string; numbers_show: string; verdict: string }[];
    track_record_summary: string;
    biggest_divergence: string;
  };
  guidance: {
    items: { metric: string; what_management_said: string; source_period: string; current_run_rate: string; likelihood: string; reason: string }[];
    capex_guided_cr: number | null;
    capex_note: string | null;
  };
  bull_case: { points: string[]; key_catalyst: string };
  bear_case: { points: string[]; key_risk: string };
}

// ─── Alert Config ────────────────────────────────────────────────────────────
export interface AlertConfig {
  price_threshold_pct: number;
  volume_multiplier: number;
  alert_categories: string[];
}

// ─── Portfolio ───────────────────────────────────────────────────────────────
export interface PortfolioStock {
  ticker: string;
  name: string;
  sector: string;
  price: number | null;
  change_pct: number | null;
  week52_high: number | null;
  week52_low: number | null;
  sparkline: number[];
}
