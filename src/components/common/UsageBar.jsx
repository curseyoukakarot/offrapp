export function UsageBar({ value, max, color = 'bg-blue-600' }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0));
  return (
    <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
      <div className={`h-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}


