import { cn } from "@/lib/utils";

type Status = "draft" | "published" | "archived";

const STATUS_STYLES: Record<
  Status,
  { dot: string; text: string; label: string }
> = {
  draft: {
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    label: "Draft",
  },
  published: {
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    label: "Published",
  },
  archived: {
    dot: "bg-zinc-400",
    text: "text-muted-foreground",
    label: "Archived",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium tabular-nums",
        s.text,
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-1.5 w-1.5 rounded-full ring-2 ring-current/10",
          s.dot,
        )}
      />
      {s.label}
    </span>
  );
}
