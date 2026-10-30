"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import AnnouncementCard from "@/components/push/AnnouncementCard";
import AlertBanner from "@/components/push/AlertBanner";
import WindowPicker from "@/components/push/WindowPicker";

const WINDOW_OPTIONS = [
  { label: "1h",  value: 1  },
  { label: "6h",  value: 6  },
  { label: "24h", value: 24 },
  { label: "3d",  value: 72 },
  { label: "7d",  value: 168},
];

export default function PushPage() {
  const [digest, setDigest]       = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [windowHours, setWindowHours] = useState(24);
  const [showUnclassified, setShowUnclassified] = useState(false);
  const [error, setError]         = useState("");

  const load = useCallback(async (hours = windowHours) => {
    setLoading(true);
    setError("");
    try {
      const data: any = await api.push.digest(hours);
      setDigest(data);
    } catch (e) {
      setError("Failed to load digest. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [windowHours]);

  useEffect(() => { load(windowHours); }, [windowHours]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.push.refresh();
      setTimeout(() => load(windowHours), 3000);
    } catch {}
    finally { setRefreshing(false); }
  };

  const announcements: any[] = (digest?.announcements ?? []).filter((a: any) =>
    showUnclassified || a.category !== "unclassified"
  );
  const priceAlerts: any[] = digest?.price_alerts ?? [];
  const material    = announcements.filter((a: any) => a.is_material);
  const nonMaterial = announcements.filter((a: any) => !a.is_material);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#222] px-4 pt-safe">
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight">FINN</h1>
            <p className="text-xs text-[#888] mt-0.5">
              {loading ? "Loading..." : `${digest?.counts?.total ?? 0} filings · ${priceAlerts.length} alerts`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-sm disabled:opacity-40"
            >
              {refreshing ? "⏳" : "↻"}
            </button>
          </div>
        </div>
        <WindowPicker value={windowHours} onChange={setWindowHours} options={WINDOW_OPTIONS} />
      </div>

      <div className="px-4 pb-28 space-y-3 mt-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">{error}</div>
        )}

        {/* Price / Volume Alerts */}
        {priceAlerts.length > 0 && (
          <section>
            <p className="text-[10px] font-semibold text-[#888] uppercase tracking-widest mb-2">Market Alerts</p>
            <div className="space-y-2">
              {priceAlerts.map((a: any, i: number) => <AlertBanner key={i} alert={a} />)}
            </div>
          </section>
        )}

        {/* Material Announcements */}
        {!loading && material.length > 0 && (
          <section>
            <p className="text-[10px] font-semibold text-[#888] uppercase tracking-widest mb-2">
              Material · {material.length}
            </p>
            <div className="space-y-2">
              {material.map((a: any, i: number) => <AnnouncementCard key={i} ann={a} defaultExpanded />)}
            </div>
          </section>
        )}

        {/* Other Announcements */}
        {!loading && nonMaterial.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-[#888] uppercase tracking-widest">
                Other · {nonMaterial.length}
              </p>
              <button
                onClick={() => setShowUnclassified(v => !v)}
                className="text-[10px] text-[#555] underline"
              >
                {showUnclassified ? "Hide routine" : "Show all"}
              </button>
            </div>
            <div className="space-y-2">
              {nonMaterial.map((a: any, i: number) => <AnnouncementCard key={i} ann={a} />)}
            </div>
          </section>
        )}

        {loading && (
          <div className="space-y-2 mt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-[#141414] border border-[#222] rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && announcements.length === 0 && priceAlerts.length === 0 && !error && (
          <div className="text-center py-16 text-[#444]">
            <p className="text-3xl mb-3">📭</p>
            <p className="text-sm">Nothing material in the last {windowHours < 24 ? `${windowHours}h` : `${windowHours/24}d`}</p>
          </div>
        )}
      </div>
    </div>
  );
}
