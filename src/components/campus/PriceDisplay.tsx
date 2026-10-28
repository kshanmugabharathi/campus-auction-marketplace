import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PriceDisplay({
  amount, label, size = "md", className,
}: { amount: number; label?: string; size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <div className={className}>
      {label && <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>}
      <div className={cn("font-display font-bold tabular-nums text-foreground",
        size === "sm" && "text-base", size === "md" && "text-xl", size === "lg" && "text-4xl")}>
        {inr(amount)}
      </div>
    </div>
  );
}
