"use client";
interface Props { data: number[]; positive: boolean; width?: number; height?: number; }
export default function Sparkline({ data, positive, width = 80, height = 32 }: Props) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) =>
    `${((i / (data.length - 1)) * width).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`
  ).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts} fill="none" stroke={positive ? "#34d399" : "#f87171"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
