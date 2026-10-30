"use client";
import { useState } from "react";
import type { Announcement, ResultsEnrichment, MgmtEnrichment } from "@/lib/types";

const CAT_STYLE: Record<string, string> = {
  results:           "text-blue-400 bg-blue-400/10",
  "M&A":             "text-purple-400 bg-purple-400/10",
  management_change: "text-orange-400 bg-orange-400/10",
  litigation:        "text-red-400 bg-red-400/10",
  fund_raise:        "text-green-400 bg-green-400/10",
  credit_rating:     "text-yellow-400 bg-yellow-400/10",
  dividend:          "text-emerald-400 bg-emerald-400/10",
  capex:             "text-cyan-400 bg-cyan-400/10",
  press_release:     "text-[#888] bg-[#888]/10",
  earnings_call:     "text-indigo-400 bg-indigo-400/10",
  unclassified:      "text-[#555] bg-[#555]/10",
};
const CAT_LABEL: Record<string, string> = {
  results:"RESULTS","M&A":"M&A",management_change:"MGMT",litigation:"LEGAL",
  fund_raise:"FUNDING",credit_rating:"RATING",dividend:"DIVIDEND",capex:"CAPEX",
  press_release:"NEWS",earnings_call:"CONCALL",investor_meetings:"INVESTOR",
  bonus_split:"SPLIT",pledging:"PLEDGE",insider_trading:"INSIDER",
  postal_ballot:"BALLOT",agm_egm:"AGM/EGM",unclassified:"MISC",
};

function fmtTime(iso: string) {
  const d = new Date(iso), now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3_600_000;
  if (diffH < 1)  return `${Math.round(diffH * 60)}m ago`;
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function AnnouncementCard({ ann, defaultExpanded = false }: { ann: Announcement; defaultExpanded?: boolean }) {
  const [open, setOpen] = useState(defaultExpanded);
  const styleCls = CAT_STYLE[ann.category] ?? CAT_STYLE.unclassified;

  return (
    <div onClick={() => setOpen(o => !o)}
      className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4 cursor-pointer active:bg-[#1a1a1a] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-mono text-sm font-bold">{ann.ticker}</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${styleCls}`}>
            {CAT_LABEL[ann.category] ?? ann.category.toUpperCase()}
          </span>
          {ann.is_material && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />}
        </div>
        <span className="text-[10px] text-[#555] flex-shrink-0">{fmtTime(ann.ann_timestamp)}</span>
      </div>

      <p className="text-sm text-[#ccc] mt-1.5 leading-snug">{ann.summary}</p>

      {open && ann.category === "results" && ann.enrichment && (
        <ResultsDetail data={ann.enrichment as ResultsEnrichment} />
      )}
      {open && ann.category === "management_change" && ann.enrichment && (
        <MgmtDetail data={ann.enrichment as MgmtEnrichment} />
      )}
      {open && ann.attachment_url && (
        <a href={ann.attachment_url} target="_blank" rel="noreferrer"
          onClick={e => e.stopPropagation()}
          className="mt-3 text-[11px] text-blue-400 block">
          View filing on NSE ↗
        </a>
      )}
    </div>
  );
}

function ResultsDetail({ data }: { data: ResultsEnrichment }) {
  const metrics = [
    { label: "Revenue", key: "revenue" as const },
    { label: "EBITDA",  key: "ebitda"  as const },
    { label: "PBT",     key: "pbt"     as const },
    { label: "PAT",     key: "pat"     as const },
  ];
  return (
    <div className="mt-3 space-y-2">
      {data.period && <p className="text-[10px] text-[#555] uppercase tracking-wider">{data.period}</p>}
      <div className="grid grid-cols-2 gap-1.5">
        {metrics.map(({ label, key }) => {
          const m = data[key];
          if (!m?.current) return null;
          return (
            <div key={key} className="bg-[#1a1a1a] rounded-lg p-2.5">
              <p className="text-[9px] text-[#555] uppercase tracking-wider">{label}</p>
              <p className="text-sm font-semibold mt-0.5">
                ₹{(m.current >= 100 ? `${Math.round(m.current / 100)}Cr` : `${m.current}Cr`)}
              </p>
              <div className="flex gap-2 mt-0.5">
                {m.qoq_pct != null && (
                  <span className={`text-[9px] ${m.qoq_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {m.qoq_pct > 0 ? "+" : ""}{m.qoq_pct}% QoQ
                  </span>
                )}
                {m.yoy_pct != null && (
                  <span className={`text-[9px] ${m.yoy_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {m.yoy_pct > 0 ? "+" : ""}{m.yoy_pct}% YoY
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {data.key_highlight && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5">
          <p className="text-xs text-blue-300">{data.key_highlight}</p>
        </div>
      )}
    </div>
  );
}

function MgmtDetail({ data }: { data: MgmtEnrichment }) {
  return (
    <div className="mt-3 bg-[#1a1a1a] rounded-xl p-3 space-y-1.5">
      {data.person_name && <p className="text-sm font-medium">{data.person_name}</p>}
      <p className="text-xs text-[#888]">
        {data.change_type === "appointment" ? "Joining as" : data.change_type === "resignation" ? "Leaving as" : ""} {data.role}
        {data.effective_date ? ` · Effective ${data.effective_date}` : ""}
      </p>
      {data.incoming_background && (
        <p className="text-xs text-[#666] leading-relaxed">{data.incoming_background}</p>
      )}
    </div>
  );
}
