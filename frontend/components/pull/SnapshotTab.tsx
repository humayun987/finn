"use client";
import type { Research } from "@/lib/types";

export default function SnapshotTab({ data }: { data: Research }) {
  const bs = data.business_snapshot;
  const tr = data.trajectory;
  return (
    <div className="space-y-4">
      <Card title="What they do">
        <p className="text-sm text-[#ccc] leading-relaxed">{bs?.what_they_do || "—"}</p>
        {bs?.moat_claim && (
          <div className="mt-3 bg-[#1a1a1a] rounded-xl p-3">
            <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Management's moat claim</p>
            <p className="text-xs text-[#aaa] italic">"{bs.moat_claim}"</p>
          </div>
        )}
      </Card>

      {bs?.segments && bs.segments.length > 0 && (
        <Card title="Segments">
          <div className="space-y-2">
            {bs.segments.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-[#ccc]">{s.name}</span>
                <div className="flex gap-3 text-xs">
                  {s.revenue_share_pct != null && (
                    <span className="text-[#888]">{s.revenue_share_pct}% rev</span>
                  )}
                  {s.ebitda_share_pct != null && (
                    <span className="text-[#888]">{s.ebitda_share_pct}% EBITDA</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tr && (
        <Card title="Trajectory">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <TrendBadge label="Revenue" trend={tr.revenue_trend} />
            <TrendBadge label="Margins" trend={tr.margin_trend} />
          </div>
          {tr.key_driver && (
            <div className="mb-2">
              <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Key driver</p>
              <p className="text-sm text-[#ccc] leading-relaxed">{tr.key_driver}</p>
            </div>
          )}
          {tr.key_concern && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
              <p className="text-[10px] text-orange-400 uppercase tracking-wider mb-1">⚠ Key concern</p>
              <p className="text-xs text-[#ccc]">{tr.key_concern}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4">
      <p className="text-[10px] text-[#555] uppercase tracking-widest font-semibold mb-3">{title}</p>
      {children}
    </div>
  );
}

function TrendBadge({ label, trend }: { label: string; trend: string }) {
  const color = trend === "accelerating" || trend === "expanding" ? "text-green-400 bg-green-400/10"
    : trend === "decelerating" || trend === "compressing" ? "text-red-400 bg-red-400/10"
    : "text-[#888] bg-[#888]/10";
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-2.5">
      <p className="text-[9px] text-[#555] uppercase tracking-wider">{label}</p>
      <span className={`text-xs font-medium px-1.5 py-0.5 rounded mt-1 inline-block ${color}`}>
        {trend || "unknown"}
      </span>
    </div>
  );
}
