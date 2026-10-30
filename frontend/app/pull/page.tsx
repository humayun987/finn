"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const POPULAR = ["RELIANCE","TCS","HDFCBANK","BAJFINANCE","INFY","ZOMATO","TATAMOTORS","SUNPHARMA"];

export default function PullPage() {
  const [query, setQuery]       = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    api.pull.companies().then((d: any) => setCompanies(d)).catch(() => {});
  }, []);

  const filtered = query.length >= 1
    ? companies.filter((c: any) =>
        c.ticker.toLowerCase().includes(query.toLowerCase()) ||
        c.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  const go = (ticker: string) => router.push(`/pull/${ticker}`);

  return (
    <div className="min-h-screen px-4 pt-safe">
      <div className="pt-4 pb-2">
        <h1 className="text-lg font-bold">Research</h1>
        <p className="text-xs text-[#888] mt-0.5">Search any NSE-listed company</p>
      </div>

      {/* Search */}
      <div className="relative mt-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]">🔍</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && query.trim()) go(query.trim().toUpperCase()); }}
          placeholder="Ticker or company name..."
          className="w-full bg-[#141414] border border-[#333] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-[#555] outline-none focus:border-[#555]"
        />
      </div>

      {/* Autocomplete results */}
      {filtered.length > 0 && (
        <div className="mt-1 bg-[#141414] border border-[#333] rounded-xl overflow-hidden">
          {filtered.map((c: any) => (
            <button
              key={c.ticker}
              onClick={() => go(c.ticker)}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#1e1e1e] last:border-0 text-left active:bg-[#1e1e1e]"
            >
              <span className="font-mono text-sm font-bold text-white w-20">{c.ticker}</span>
              <div className="min-w-0">
                <p className="text-sm text-[#ccc] truncate">{c.name}</p>
                <p className="text-[10px] text-[#555]">{c.sector}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Quick picks */}
      <div className="mt-6">
        <p className="text-[10px] font-semibold text-[#888] uppercase tracking-widest mb-3">Portfolio</p>
        <div className="grid grid-cols-4 gap-2">
          {POPULAR.map(t => (
            <button
              key={t}
              onClick={() => go(t)}
              className="bg-[#141414] border border-[#222] rounded-xl py-3 text-xs font-mono font-bold text-white active:bg-[#1e1e1e] transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* All companies */}
      <div className="mt-6 pb-28">
        <p className="text-[10px] font-semibold text-[#888] uppercase tracking-widest mb-3">All ({companies.length})</p>
        <div className="space-y-1">
          {companies.map((c: any) => (
            <button
              key={c.ticker}
              onClick={() => go(c.ticker)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#141414] border border-[#1e1e1e] rounded-xl text-left active:bg-[#1e1e1e]"
            >
              <div>
                <span className="font-mono text-sm font-bold">{c.ticker}</span>
                <span className="ml-2 text-xs text-[#888]">{c.name}</span>
              </div>
              <span className="text-[10px] text-[#555] bg-[#1e1e1e] px-2 py-1 rounded-lg">{c.sector}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
