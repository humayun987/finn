"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

const ALL_CATS = [
  "results","M&A","management_change","litigation","fund_raise",
  "credit_rating","capex","dividend","press_release","earnings_call",
];

export default function AlertConfig({ onClose }: { onClose: () => void }) {
  const [cfg, setCfg] = useState<{
    price_threshold_pct: number;
    volume_multiplier: number;
    alert_categories: string[];
  }>({
    price_threshold_pct: 5.0,
    volume_multiplier: 2.0,
    alert_categories: ["results", "M&A", "management_change", "litigation", "credit_rating"],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.portfolio.alerts()
      .then((d: any) => {
        if (d && typeof d === "object") {
          setCfg({
            price_threshold_pct: Number(d.price_threshold_pct) || 5.0,
            volume_multiplier: Number(d.volume_multiplier) || 2.0,
            alert_categories: Array.isArray(d.alert_categories)
              ? d.alert_categories
              : ["results", "M&A", "management_change", "litigation", "credit_rating"],
          });
        }
      })
      .catch(() => {});
  }, []);

  const toggleCat = (cat: string) => {
    setCfg(prev => {
      const current = Array.isArray(prev.alert_categories) ? prev.alert_categories : [];
      return {
        ...prev,
        alert_categories: current.includes(cat)
          ? current.filter(c => c !== cat)
          : [...current, cat],
      };
    });
  };

  const save = async () => {
    setSaving(true);
    try { await api.portfolio.updateAlerts(cfg); onClose(); }
    catch {}
    finally { setSaving(false); }
  };

  return (
    <div className="bg-[#141414] border border-[#222] rounded-2xl p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Alert Thresholds</h2>
        <button onClick={onClose} className="text-[#555] text-lg">×</button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs text-[#888]">Price move threshold</label>
            <span className="text-xs font-mono text-white">±{cfg.price_threshold_pct}%</span>
          </div>
          <input type="range" min={1} max={15} step={0.5} value={cfg.price_threshold_pct}
            onChange={e => setCfg(p => ({ ...p, price_threshold_pct: parseFloat(e.target.value) }))}
            className="w-full accent-white" />
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs text-[#888]">Volume spike trigger</label>
            <span className="text-xs font-mono text-white">{cfg.volume_multiplier}× avg</span>
          </div>
          <input type="range" min={1.5} max={5} step={0.5} value={cfg.volume_multiplier}
            onChange={e => setCfg(p => ({ ...p, volume_multiplier: parseFloat(e.target.value) }))}
            className="w-full accent-white" />
        </div>

        <div>
          <p className="text-xs text-[#888] mb-2">Alert me for these announcement types</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_CATS.map(cat => {
              const active = (cfg.alert_categories || []).includes(cat);
              return (
                <button key={cat} onClick={() => toggleCat(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-colors
                    ${active ? "bg-white text-black border-white" : "bg-transparent text-[#555] border-[#333]"}`}>
                  {cat.replace("_"," ").toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="w-full py-3 bg-white text-black text-sm font-semibold rounded-xl disabled:opacity-50">
        {saving ? "Saving..." : "Save alerts"}
      </button>
    </div>
  );
}
