export default function LoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 px-4 pt-4">
      {[...Array(rows)].map((_, i) => <div key={i} className="h-16 bg-[#141414] border border-[#1e1e1e] rounded-xl animate-pulse" />)}
    </div>
  );
}
