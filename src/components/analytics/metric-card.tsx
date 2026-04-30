import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  hint,
  icon,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          {icon && <span>{icon}</span>}
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">
          {value}
        </div>
        {hint && (
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        )}
      </CardContent>
    </Card>
  );
}
