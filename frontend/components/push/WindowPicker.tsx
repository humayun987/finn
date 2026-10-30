"use client";
interface Option { label: string; value: number; }
interface Props  { value: number; onChange: (v: number) => void; options: Option[]; }
export default function WindowPicker({ value, onChange, options }: Props) {
  return (
    <div className="flex gap-1 pb-2 overflow-x-auto scrollbar-none">
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors
            ${value === o.value ? "bg-white text-black" : "bg-[#1a1a1a] text-[#888] border border-[#2a2a2a]"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
