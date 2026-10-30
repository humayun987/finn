"use client";
interface Props { alert: { ticker: string; alert_type: string; value: number; direction?: string; severity: string; message: string; }; }
export default function AlertBanner({ alert }: Props) {
  const isHigh  = alert.severity === "high";
  const isPrice = alert.alert_type === "price_move";
  const colorCls = isHigh ? "bg-red-500/10 border-red-500/40 text-red-300" : "bg-orange-500/10 border-orange-500/40 text-orange-300";
  const icon = isPrice ? (alert.direction === "up" ? "▲" : "▼") : "⚡";
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${colorCls}`}>
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <span className="font-mono text-xs font-bold mr-2">{alert.ticker}</span>
        <span className="text-xs">{alert.message}</span>
      </div>
      <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${isHigh ? "bg-red-500/20" : "bg-orange-500/20"}`}>
        {isHigh ? "HIGH" : "MED"}
      </span>
    </div>
  );
}
