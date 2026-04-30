import { Badge } from "./badge";
import { cn } from "@/lib/utils";

type Status = "draft" | "published" | "archived";

const STATUS_CLASS: Record<Status, string> = {
  draft: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  published:
    "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  archived: "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-100",
};

const STATUS_LABEL: Record<Status, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2 py-0.5 text-xs font-medium",
        STATUS_CLASS[status],
        className,
      )}
    >
      <span
        className={cn(
          "mr-1 inline-block h-1.5 w-1.5 rounded-full",
          status === "draft" && "bg-amber-500",
          status === "published" && "bg-emerald-500",
          status === "archived" && "bg-zinc-500",
        )}
      />
      {STATUS_LABEL[status]}
    </Badge>
  );
}
