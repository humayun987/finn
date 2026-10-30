"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Sparkline from "@/components/shared/Sparkline";
import AlertConfig from "@/components/portfolio/AlertConfig";
import type { PortfolioStock } from "@/lib/types";

export default function PortfolioPage() {
  const [stocks, setStocks]   = useState<PortfolioStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    api.portfolio.get().then((d: any) => {
      setStocks(d.portfolio ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const gainers = stocks.filter(s => (s.change_pct ?? 0) > 0).length;
  const losers  = stocks.filter(s => (s.change_pct ?? 0) < 0).length;

  return (
    <div className="min-h-screen pb-28">
      <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#222] px-4 pt-safe">
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="text-lg font-bold">Portfolio</h1>
            {!loading && <p className="text-xs text-[#888] mt-0.5">{gainers}↑ {losers}↓ today</p>}
          </div>
          <button onClick={() => setShowConfig(v => !v)}
            className="text-xs text-[#888] bg-[#1a1a1a] border border-[#333] px-3 py-1.5 rounded-lg">
            ⚙ Alerts
          </button>
        </div>
      </div>
      {showConfig && <div className="px-4 pt-4"><AlertConfig onClose={() => setShowConfig(false)} /></div>}
      <div className="px-4 mt-4 space-y-2">
        {loading && [...Array(10)].map((_, i) => (
          <div key={i} className="h-16 bg-[#141414] border border-[#1e1e1e] rounded-xl animate-pulse" />
        ))}
        {!loading && stocks.map(stock => (
          <div key={stock.ticker} className="bg-[#141414] border border-[#1e1e1e] rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-mono text-sm font-bold">{stock.ticker}</p>
              <p className="text-[10px] text-[#555] truncate max-w-[100px]">{stock.sector}</p>
            </div>
            <div className="flex-1 mx-3">
              {(stock.sparkline?.length ?? 0) > 1 && <Sparkline data={stock.sparkline} positive={(stock.change_pct ?? 0) >= 0} />}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{stock.price != null ? `₹${stock.price.toLocaleString("en-IN")}` : "—"}</p>
              {stock.change_pct != null && (
                <p className={`text-xs font-medium ${stock.change_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {stock.change_pct > 0 ? "+" : ""}{stock.change_pct.toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
