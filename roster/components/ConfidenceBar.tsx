export function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 70 ? "var(--color-healthy)" : pct >= 45 ? "var(--color-warning)" : "#B3261E";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-32 overflow-hidden rounded-full bg-[var(--color-surface-tint)]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}
