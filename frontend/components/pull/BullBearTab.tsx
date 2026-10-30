"use client";
interface Case { points: string[]; key_catalyst?: string; key_risk?: string; }
interface Props { bull: Case | undefined; bear: Case | undefined; }
export default function BullBearTab({ bull, bear }: Props) {
  return (
    <div className="space-y-4">
      {bull && (
        <div className="bg-green-500/10 border border-green-500/25 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-green-400 uppercase tracking-widest">Bull Case</p>
          <ul className="space-y-2">
            {bull.points?.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm text-[#d0d0d0] leading-relaxed">
                <span className="text-green-400 mt-0.5 flex-shrink-0">+</span>{p}
              </li>
            ))}
          </ul>
          {bull.key_catalyst && (
            <div className="bg-green-500/10 rounded-xl p-3 border-t border-green-500/20 pt-3">
              <p className="text-[10px] text-green-400 uppercase tracking-wider mb-1">Key catalyst</p>
              <p className="text-xs text-[#ccc]">{bull.key_catalyst}</p>
            </div>
          )}
        </div>
      )}
      {bear && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Bear Case</p>
          <ul className="space-y-2">
            {bear.points?.map((p, i) => (
              <li key={i} className="flex gap-2 text-sm text-[#d0d0d0] leading-relaxed">
                <span className="text-red-400 mt-0.5 flex-shrink-0">−</span>{p}
              </li>
            ))}
          </ul>
          {bear.key_risk && (
            <div className="bg-red-500/10 rounded-xl p-3 border-t border-red-500/20 pt-3">
              <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1">Key risk</p>
              <p className="text-xs text-[#ccc]">{bear.key_risk}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
