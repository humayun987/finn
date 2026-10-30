const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API POST ${path} → ${res.status}`);
  return res.json();
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API PUT ${path} → ${res.status}`);
  return res.json();
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
