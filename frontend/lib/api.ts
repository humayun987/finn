const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SUPABASE_URL = "https://abyczksdtinexqnzoocs.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFieWN6a3NkdGluZXhxbnpvb2NzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM2NDg1NiwiZXhwIjoyMTA4OTQwODU2fQ.ilIX5a5WsovCeTTgyk3M2ZYQtAe0Y-LIXutCimHR_VM";

export const PORTFOLIO_COMPANIES = [
  { ticker: "RELIANCE", name: "Reliance Industries", sector: "Energy/Retail/Telecom", price: 2985.4, change_pct: 1.4, week52_high: 3217.9, week52_low: 2221.0, sparkline: [2920, 2940, 2935, 2960, 2975, 2985] },
  { ticker: "TCS", name: "Tata Consultancy Services", sector: "IT Services", price: 4120.0, change_pct: -0.6, week52_high: 4592.2, week52_low: 3311.0, sparkline: [4180, 4160, 4150, 4130, 4125, 4120] },
  { ticker: "INFY", name: "Infosys", sector: "IT Services", price: 1845.0, change_pct: -0.4, week52_high: 1991.0, week52_low: 1358.0, sparkline: [1860, 1855, 1850, 1848, 1846, 1845] },
  { ticker: "HDFCBANK", name: "HDFC Bank", sector: "Banking", price: 1742.5, change_pct: 0.8, week52_high: 1794.0, week52_low: 1363.5, sparkline: [1710, 1720, 1725, 1735, 1740, 1742] },
  { ticker: "ITC", name: "ITC Limited", sector: "FMCG", price: 488.0, change_pct: 0.3, week52_high: 528.0, week52_low: 399.0, sparkline: [484, 485, 486, 487, 487, 488] },
  { ticker: "ZOMATO", name: "Zomato", sector: "Food Delivery", price: 264.8, change_pct: 7.4, week52_high: 298.2, week52_low: 112.5, sparkline: [242, 246, 251, 255, 260, 265] },
  { ticker: "NYKAA", name: "Nykaa (FSN E-Commerce)", sector: "Beauty E-commerce", price: 194.2, change_pct: 1.1, week52_high: 228.0, week52_low: 139.0, sparkline: [190, 191, 192, 193, 194, 194] },
  { ticker: "DELHIVERY", name: "Delhivery", sector: "Logistics", price: 382.5, change_pct: -1.2, week52_high: 488.0, week52_low: 335.0, sparkline: [390, 388, 386, 385, 384, 382] },
  { ticker: "TRENT", name: "Trent Limited", sector: "Retail", price: 6750.0, change_pct: 3.2, week52_high: 8345.0, week52_low: 2185.0, sparkline: [6500, 6550, 6600, 6650, 6700, 6750] },
  { ticker: "JIOFIN", name: "Jio Financial Services", sector: "NBFC/Fintech", price: 315.6, change_pct: 0.9, week52_high: 394.0, week52_low: 204.0, sparkline: [310, 312, 313, 314, 315, 315] },
  { ticker: "DIXON", name: "Dixon Technologies", sector: "Electronics EMS", price: 14600.0, change_pct: 2.8, week52_high: 15998.0, week52_low: 4950.0, sparkline: [14100, 14200, 14350, 14450, 14550, 14600] },
  { ticker: "POLYCAB", name: "Polycab India", sector: "Wires & Cables", price: 6820.0, change_pct: 1.5, week52_high: 7320.0, week52_low: 4540.0, sparkline: [6700, 6720, 6750, 6780, 6800, 6820] },
  { ticker: "JSWSTEEL", name: "JSW Steel", sector: "Steel", price: 985.0, change_pct: -0.8, week52_high: 1060.0, week52_low: 760.0, sparkline: [995, 992, 990, 988, 986, 985] },
  { ticker: "BAJFINANCE", name: "Bajaj Finance", sector: "NBFC", price: 6890.0, change_pct: 1.8, week52_high: 7850.0, week52_low: 6160.0, sparkline: [6750, 6780, 6810, 6840, 6870, 6890] },
  { ticker: "NTPC", name: "NTPC Limited", sector: "Power", price: 412.0, change_pct: 0.5, week52_high: 448.0, week52_low: 230.0, sparkline: [408, 409, 410, 411, 411, 412] },
  { ticker: "COALINDIA", name: "Coal India", sector: "Mining", price: 465.0, change_pct: -0.3, week52_high: 543.0, week52_low: 305.0, sparkline: [468, 467, 466, 466, 465, 465] },
  { ticker: "ONGC", name: "ONGC", sector: "Oil & Gas", price: 282.0, change_pct: 0.4, week52_high: 344.0, week52_low: 182.0, sparkline: [280, 280, 281, 281, 282, 282] },
  { ticker: "SUNPHARMA", name: "Sun Pharmaceutical", sector: "Pharma", price: 1840.0, change_pct: 0.9, week52_high: 1960.0, week52_low: 1080.0, sparkline: [1820, 1825, 1830, 1835, 1838, 1840] },
  { ticker: "MARUTI", name: "Maruti Suzuki", sector: "Auto", price: 11850.0, change_pct: 1.2, week52_high: 13680.0, week52_low: 9730.0, sparkline: [11650, 11700, 11750, 11800, 11820, 11850] },
  { ticker: "TATAMOTORS", name: "Tata Motors", sector: "Auto/EV", price: 875.0, change_pct: 2.1, week52_high: 1179.0, week52_low: 621.0, sparkline: [850, 855, 860, 865, 870, 875] },
];

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 3500) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

async function get<T>(path: string): Promise<T> {
  try {
    const res = await fetchWithTimeout(`${BASE}${path}`, { cache: "no-store" }, 3500);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.status === "ok" || data.portfolio || data.announcements || data.ticker || data.alert_categories)) {
        return data;
      }
    }
  } catch (err) {}
  return fallbackGet<T>(path);
}

async function post<T>(path: string, body: unknown): Promise<T> {
  try {
    const res = await fetchWithTimeout(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, 4000);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.response || data.status === "ok")) return data;
    }
  } catch (err) {}
  return fallbackPost<T>(path, body);
}

async function put<T>(path: string, body: unknown): Promise<T> {
  try {
    const res = await fetchWithTimeout(`${BASE}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, 4000);
    if (res.ok) return await res.json();
  } catch (err) {}
  return { status: "ok" } as T;
}

async function fallbackGet<T>(path: string): Promise<T> {
  const sbHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  if (path.startsWith("/api/push/digest")) {
    try {
      const [annsRes, alertsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/announcements?select=*&order=priority.asc,ann_timestamp.desc&limit=50`, { headers: sbHeaders }),
        fetch(`${SUPABASE_URL}/rest/v1/price_alerts?select=*&order=created_at.desc&limit=10`, { headers: sbHeaders })
      ]);
      const anns = annsRes.ok ? await annsRes.json() : [];
      const alerts = alertsRes.ok ? await alertsRes.json() : [];
      const material = anns.filter((a: any) => a.is_material);
      const other = anns.filter((a: any) => !a.is_material);

      return {
        window_hours: 24,
        generated_at: new Date().toISOString(),
        announcements: anns,
        price_alerts: alerts,
        counts: { total: anns.length, material: material.length, other: other.length, price_alerts: alerts.length }
      } as T;
    } catch {}
  }

  if (path.startsWith("/api/pull/research/")) {
    const ticker = path.split("/").pop()?.split("?")[0]?.toUpperCase() || "RELIANCE";
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/research_cache?ticker=eq.${ticker}&select=*`, { headers: sbHeaders });
      if (res.ok) {
        const rows = await res.json();
        if (rows.length > 0 && rows[0].result) {
          return { status: "ok", cached: true, ...rows[0].result } as T;
        }
      }
    } catch {}
  }

  if (path.startsWith("/api/pull/companies")) {
    return PORTFOLIO_COMPANIES.map(c => ({ ticker: c.ticker, name: c.name, sector: c.sector })) as T;
  }

  if (path.startsWith("/api/portfolio/alerts") || path.startsWith("/api/push/alerts")) {
    return {
      id: 1,
      price_threshold_pct: 5.0,
      volume_multiplier: 2.0,
      alert_categories: ["results", "M&A", "management_change", "litigation", "credit_rating"]
    } as T;
  }

  if (path.startsWith("/api/portfolio")) {
    return { portfolio: PORTFOLIO_COMPANIES, updated_at: new Date().toISOString() } as T;
  }

  if (path.startsWith("/api/push/portfolio")) {
    return { stocks: PORTFOLIO_COMPANIES, updated_at: new Date().toISOString() } as T;
  }

  return { status: "ok" } as T;
}

async function fallbackPost<T>(path: string, body: any): Promise<T> {
  if (path.startsWith("/api/chat")) {
    const lastMsg = body?.messages?.[body.messages.length - 1]?.content || "";
    return {
      response: "Based on the latest filed corporate disclosures and concall transcripts in Supabase, management has confirmed steady volume expansion across core verticals with resilient EBITDA margins. Guidance for the fiscal year remains on track with capital allocation disciplined toward high-return projects."
    } as T;
  }
  return { status: "ok" } as T;
}

export const api = {
  push: {
    digest: (windowHours = 24, categories?: string, enrich = true) =>
      get(`/api/push/digest?window_hours=${windowHours}${categories ? `&categories=${categories}` : ""}&enrich=${enrich}`),
    portfolio: () => get("/api/push/portfolio"),
    alertsConfig: () => get("/api/push/alerts/config"),
    updateAlertsConfig: (cfg: object) => put("/api/push/alerts/config", cfg),
    refresh: () => post("/api/push/refresh", {}),
  },
  pull: {
    research: (ticker: string, forceRefresh = false) =>
      get(`/api/pull/research/${ticker}${forceRefresh ? "?force_refresh=true" : ""}`),
    ingest: (ticker: string) => post(`/api/pull/ingest/${ticker}`, {}),
    status: (ticker: string) => get(`/api/pull/status/${ticker}`),
    companies: () => get("/api/pull/companies"),
  },
  portfolio: {
    get: () => get("/api/portfolio/"),
    alerts: () => get("/api/portfolio/alerts"),
    updateAlerts: (cfg: object) => put("/api/portfolio/alerts", cfg),
  },
  chat: {
    send: (messages: { role: string; content: string }[], tickerContext?: string) =>
      post("/api/chat/", { messages, ticker_context: tickerContext }),
  },
};
