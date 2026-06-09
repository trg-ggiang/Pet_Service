export function PerfBar({ value }: { value: number }) {
  const color =
    value >= 90
      ? "bg-emerald-500"
      : value >= 75
        ? "bg-cyan-500"
        : value >= 60
          ? "bg-amber-400"
          : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="font-mono text-[11px] font-bold text-foreground w-7 text-right">
        {value}%
      </span>
    </div>
  );
}
