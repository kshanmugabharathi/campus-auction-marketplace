import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export function Countdown({ closesAt, className, large }: { closesAt: string; className?: string; large?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return <span className={cn("tabular-nums text-muted-foreground", className)}>—</span>;
  const ms = new Date(closesAt).getTime() - now;
  if (ms <= 0) return <span className={cn("font-semibold text-muted-foreground", className)}>Closed</span>;
  const { d, h, m, s } = parts(ms);
  const urgent = ms < 3600_000;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (large) {
    const cells = d > 0 ? [[d, "days"], [h, "hrs"], [m, "min"], [s, "sec"]] : [[h, "hrs"], [m, "min"], [s, "sec"]];
    return (
      <div className={cn("flex gap-2", className)}>
        {cells.map(([v, l]) => (
          <div key={l} className={cn("min-w-14 rounded-xl px-3 py-2 text-center", urgent ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground")}>
            <div className="font-display text-2xl font-bold tabular-nums">{pad(v as number)}</div>
            <div className="text-[10px] uppercase tracking-wider opacity-70">{l}</div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <span className={cn("font-semibold tabular-nums", urgent ? "text-destructive" : "text-foreground", className)}>
      {d > 0 ? `${d}d ${h}h` : `${pad(h)}:${pad(m)}:${pad(s)}`}
    </span>
  );
}
