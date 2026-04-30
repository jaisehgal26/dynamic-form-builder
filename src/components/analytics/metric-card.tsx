import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
  accent?: boolean;
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
  className,
  accent,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card px-4 py-3.5 transition-colors hover:bg-muted/40",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon && <span className="text-muted-foreground/80">{icon}</span>}
        <span>{label}</span>
      </div>
      <div
        className={cn(
          "mt-1.5 text-2xl font-semibold tabular-nums tracking-tightish",
          accent && "text-primary",
        )}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}
