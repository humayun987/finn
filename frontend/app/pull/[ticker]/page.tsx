"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Research } from "@/lib/types";
import SnapshotTab  from "@/components/pull/SnapshotTab";
import NarrativeTab from "@/components/pull/NarrativeTab";
import GuidanceTab  from "@/components/pull/GuidanceTab";
import BullBearTab  from "@/components/pull/BullBearTab";

type Tab = "snapshot" | "narrative" | "guidance" | "bullbear";
const TABS: { key: Tab; label: string }[] = [
  { key: "snapshot",  label: "Overview"        },
  { key: "narrative", label: "Story vs Numbers" },
  { key: "guidance",  label: "Guidance"         },
  { key: "bullbear",  label: "Bull / Bear"      },
];

export default function ResearchPage() {
  const { ticker }  = useParams<{ ticker: string }>();
  const router      = useRouter();
  const [data, setData]       = useState<Research | null>(null);
  const [status, setStatus]   = useState<"loading"|"ingesting"|"ok"|"error">("loading");
  const [tab, setTab]         = useState<Tab>("snapshot");
  const [msg, setMsg]         = useState("");
  const pollRef               = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadResearch();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [ticker]);

  async function loadResearch() {
    setStatus("loading");
    try {
      const res: any = await api.pull.research(ticker);
      if (res.status === "ingesting") {
        setStatus("ingesting");
        setMsg(res.message || "Fetching documents...");
        // Poll every 8 seconds
        pollRef.current = setInterval(async () => {
          try {
            const r: any = await api.pull.research(ticker);
            if (r.status === "ok") {
              clearInterval(pollRef.current!);
              setData(r as Research);
              setStatus("ok");
            }
          } catch {}
        }, 8000);
      } else if (res.status === "ok" || res.ticker) {
        setData(res as Research);
        setStatus("ok");
      } else {
        setStatus("error");
        setMsg(res.error || "Something went wrong");
      }
    } catch (e) {
      setStatus("error");
      setMsg("Failed to load research");
    }
  }

  if (status === "loading") return <LoadingPulse ticker={ticker} />;
  if (status === "ingesting") return <IngestingScreen ticker={ticker} message={msg} />;
  if (status === "error") return <ErrorScreen message={msg} onBack={() => router.back()} />;
  if (!data) return null;

  const fin = data.financial_snapshot;

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#222] px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button onClick={() => router.back()} className="text-[#888] text-lg">←</button>
          <div className="min-w-0">
            <h1 className="text-base font-bold">{data.ticker}</h1>
            <p className="text-[11px] text-[#888] truncate">{data.company_name} · {data.sector}</p>
          </div>
          <button
            onClick={() => loadResearch()}
            className="ml-auto text-xs text-[#555] bg-[#1a1a1a] border border-[#333] px-2 py-1 rounded-lg"
          >
            Refresh
          </button>
        </div>

        {/* Fin snapshot strip */}
        <div className="grid grid-cols-3 gap-1.5 pb-3">
          <FinCell label="Revenue" value={fin?.revenue_ttm_cr ? `₹${Math.round(fin.revenue_ttm_cr/100)}Cr` : "—"} />
          <FinCell label="EBITDA Margin" value={fin?.ebitda_margin_pct ? `${fin.ebitda_margin_pct}%` : "—"}
            trend={fin?.ebitda_margin_trend} />
          <FinCell label="PAT" value={fin?.pat_ttm_cr ? `₹${Math.round(fin.pat_ttm_cr/100)}Cr` : "—"} />
          <FinCell label="3Y Rev CAGR" value={fin?.revenue_cagr_3y_pct ? `${fin.revenue_cagr_3y_pct}%` : "—"} />
          <FinCell label="ROE" value={fin?.roe_pct ? `${fin.roe_pct}%` : "—"} />
          <FinCell label="D/E" value={fin?.de_ratio != null ? `${fin.de_ratio}×` : "—"} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none pb-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                ${tab === t.key ? "bg-white text-black" : "bg-[#1a1a1a] text-[#888] border border-[#2a2a2a]"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 mt-4">
        {tab === "snapshot"  && <SnapshotTab  data={data} />}
        {tab === "narrative" && <NarrativeTab data={data.narrative_vs_numbers} />}
        {tab === "guidance"  && <GuidanceTab  data={data.guidance} trajectory={data.trajectory} />}
        {tab === "bullbear"  && <BullBearTab  bull={data.bull_case} bear={data.bear_case} />}
      </div>

      {data.data_note && (
        <p className="px-4 mt-6 text-[10px] text-[#444]">Source: {data.data_note}</p>
      )}
    </div>
  );
}

function FinCell({ label, value, trend }: { label: string; value: string; trend?: string }) {
  const trendColor = trend === "expanding" ? "text-green-400" : trend === "compressing" ? "text-red-400" : "";
  return (
    <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl px-3 py-2">
      <p className="text-[9px] text-[#555] uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${trendColor || "text-white"}`}>{value}</p>
    </div>
  );
}

function LoadingPulse({ ticker }: { ticker: string }) {
  return (
    <div className="px-4 pt-12">
      <div className="h-6 w-24 bg-[#1a1a1a] rounded-lg animate-pulse mb-2" />
      <div className="h-4 w-40 bg-[#1a1a1a] rounded-lg animate-pulse mb-6" />
      {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-[#141414] rounded-xl animate-pulse mb-2" />)}
    </div>
  );
}

function IngestingScreen({ ticker, message }: { ticker: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
      <div className="text-4xl mb-4 animate-spin">⚙️</div>
      <h2 className="text-lg font-bold mb-2">Fetching documents for {ticker}</h2>
      <p className="text-sm text-[#888] leading-relaxed">{message}</p>
      <p className="text-xs text-[#555] mt-3">Annual reports + concall transcripts · ~60-90s</p>
    </div>
  );
}

function ErrorScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <p className="text-sm text-[#888]">{message}</p>
      <button onClick={onBack} className="mt-6 text-sm text-white bg-[#1a1a1a] border border-[#333] px-4 py-2 rounded-xl">
        Go back
      </button>
    </div>
  );
}
