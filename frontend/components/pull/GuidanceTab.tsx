"use client";

interface GuidanceItem {
  metric: string; what_management_said: string; source_period: string;
  current_run_rate: string; likelihood: string; reason: string;
}
interface Props {
  data: { items: GuidanceItem[]; capex_guided_cr: number|null; capex_note: string|null } | undefined;
  trajectory: { revenue_trend: string; margin_trend: string; key_driver: string; key_concern: string } | undefined;
}

const LIKE_STYLE: Record<string, string> = {
  achievable:"text-green-400 bg-green-400/10", stretched:"text-orange-400 bg-orange-400/10", unlikely:"text-red-400 bg-red-400/10",
};

export default function GuidanceTab({ data, trajectory }: Props) {
  if (!data?.items?.length) return <p className="text-sm text-[#555] py-8 text-center">No guidance data extracted from available documents</p>;
  return (
    <div className="space-y-3">
      {data.items.map((item, i) => (
        <div key={i} className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{item.metric}</p>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${LIKE_STYLE[item.likelihood] ?? "text-[#888] bg-[#888]/10"}`}>
              {item.likelihood}
            </span>
          </div>
          <div>
            <p className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">Guided</p>
            <p className="text-sm text-[#ccc]">{item.what_management_said}</p>
            <p className="text-[10px] text-[#444] mt-0.5">{item.source_period}</p>
          </div>
          {item.current_run_rate && (
            <div>
              <p className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">Current run-rate</p>
              <p className="text-sm text-[#ccc]">{item.current_run_rate}</p>
            </div>
          )}
          {item.reason && <p className="text-xs text-[#666] border-t border-[#222] pt-2">{item.reason}</p>}
        </div>
      ))}
      {data.capex_guided_cr && (
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4">
          <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Capex guided</p>
          <p className="text-sm font-semibold">₹{data.capex_guided_cr.toLocaleString("en-IN")}Cr</p>
          {data.capex_note && <p className="text-xs text-[#666] mt-1">{data.capex_note}</p>}
        </div>
      )}
    </div>
  );
}
