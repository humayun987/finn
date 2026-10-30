"use client";

interface Claim { management_said: string; numbers_show: string; verdict: string; }
interface Props {
  data: { claims: Claim[]; track_record_summary: string; biggest_divergence: string; } | undefined;
}

const VERDICT_STYLE: Record<string, string> = {
  exceeded:        "text-green-400  bg-green-400/10  border-green-400/20",
  on_track:        "text-blue-400   bg-blue-400/10   border-blue-400/20",
  behind:          "text-red-400    bg-red-400/10    border-red-400/20",
  too_early_to_tell:"text-[#888]   bg-[#888]/10     border-[#888]/20",
};
const VERDICT_LABEL: Record<string, string> = {
  exceeded:"Exceeded", on_track:"On track", behind:"Behind", too_early_to_tell:"Too early",
};

export default function NarrativeTab({ data }: Props) {
  if (!data) return <p className="text-sm text-[#555] py-8 text-center">No narrative data available</p>;
  return (
    <div className="space-y-4">
      {data.biggest_divergence && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
          <p className="text-[10px] text-orange-400 uppercase tracking-widest font-semibold mb-2">Biggest divergence</p>
          <p className="text-sm text-[#e0e0e0] leading-relaxed">{data.biggest_divergence}</p>
        </div>
      )}

      {data.claims?.map((c, i) => {
        const style = VERDICT_STYLE[c.verdict] ?? VERDICT_STYLE.too_early_to_tell;
        return (
          <div key={i} className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] text-[#555] uppercase tracking-wider">Management said</p>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${style}`}>
                {VERDICT_LABEL[c.verdict] ?? c.verdict}
              </span>
            </div>
            <p className="text-sm text-[#aaa] italic leading-relaxed">"{c.management_said}"</p>
            <div>
              <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Numbers show</p>
              <p className="text-sm text-[#ccc] leading-relaxed">{c.numbers_show}</p>
            </div>
          </div>
        );
      })}

      {data.track_record_summary && (
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-4">
          <p className="text-[10px] text-[#555] uppercase tracking-widest font-semibold mb-2">Track record</p>
          <p className="text-sm text-[#ccc]">{data.track_record_summary}</p>
        </div>
      )}
    </div>
  );
}
