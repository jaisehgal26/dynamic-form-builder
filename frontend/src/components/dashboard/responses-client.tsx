"use client";

import * as React from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Download,
  Inbox,
  Loader2,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  formatDateTime,
  formatDuration,
  truncate,
} from "@/lib/utils";
import type { FormFieldDef } from "@/types/form";

interface ResponseRow {
  id: string;
  respondentEmail: string | null;
  answers: Record<string, unknown>;
  metadata: Record<string, unknown>;
  startedAt: number | null;
  submittedAt: number;
  completionTimeSeconds: number | null;
}

type DateRange = "all" | "7d" | "30d" | "today";

const RANGE_LABEL: Record<DateRange, string> = {
  all: "All time",
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

function rangeToTimestamps(range: DateRange): { from?: number; to?: number } {
  if (range === "all") return {};
  const now = Date.now();
  if (range === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return { from: start.getTime(), to: now };
  }
  const days = range === "7d" ? 7 : 30;
  return { from: now - days * 24 * 60 * 60 * 1000, to: now };
}

export function ResponsesClient({
  formId,
  formTitle,
  fields,
  collectEmail,
  initialResponses,
  initialTotal,
  pageSize,
}: {
  formId: string;
  formTitle: string;
  fields: FormFieldDef[];
  collectEmail: boolean;
  initialResponses: ResponseRow[];
  initialTotal: number;
  pageSize: number;
}) {
  const router = useRouter();
  const [responses, setResponses] = React.useState(initialResponses);
  const [total, setTotal] = React.useState(initialTotal);
  const [page, setPage] = React.useState(1);
  const [range, setRange] = React.useState<DateRange>("all");
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState<ResponseRow | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const inputFields = React.useMemo(
    () =>
      fields.filter(
        (f) => f.type !== "section_heading" && f.type !== "page_break",
      ),
    [fields],
  );
  const previewFields = React.useMemo(
    () => inputFields.slice(0, collectEmail ? 2 : 3),
    [inputFields, collectEmail],
  );

  // Refetch on page or range change
  const fetchPage = React.useCallback(
    async (nextPage: number, nextRange: DateRange) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(nextPage));
        const ts = rangeToTimestamps(nextRange);
        if (ts.from) params.set("from", String(ts.from));
        if (ts.to) params.set("to", String(ts.to));
        const res = await fetch(
          `/api/forms/${formId}/responses?${params.toString()}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        setResponses(data.responses);
        setTotal(data.total);
        setPage(data.page);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [formId],
  );

  // Local search filters the visible page (server is paginated)
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return responses;
    return responses.filter((r) => {
      if (
        r.respondentEmail &&
        r.respondentEmail.toLowerCase().includes(q)
      )
        return true;
      for (const f of inputFields) {
        const v = r.answers[f.id];
        if (v === null || v === undefined) continue;
        const text = Array.isArray(v) ? v.join(" ") : String(v);
        if (text.toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [query, responses, inputFields]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/forms/${formId}/responses/${deleteId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setResponses((prev) => prev.filter((r) => r.id !== deleteId));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Response deleted");
      setDeleteId(null);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tightish">
            {formTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} response{total === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/forms/${formId}/builder`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit form
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/dashboard/forms/${formId}/analytics`}>
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant={total === 0 ? "outline" : "default"}
          >
            <a
              href={`/api/forms/${formId}/responses/export`}
              target="_blank"
              rel="noreferrer"
              aria-disabled={total === 0}
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </a>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this page…"
            className="h-9 pl-9"
          />
        </div>
        <Select
          value={range}
          onValueChange={(v) => {
            const r = v as DateRange;
            setRange(r);
            void fetchPage(1, r);
          }}
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["all", "today", "7d", "30d"] as DateRange[]).map((r) => (
              <SelectItem key={r} value={r}>
                {RANGE_LABEL[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {loading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs">
        {responses.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-5 w-5" />}
            title="No responses yet"
            description="Once people submit your form, their answers will show up here."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search className="h-5 w-5" />}
            title="No matches on this page"
            description="Try a different keyword or clear the search to see all responses."
          />
        ) : (
          <>
            {/* Mobile card list (<sm) */}
            <ul className="divide-y divide-border/60 sm:hidden">
              {filtered.map((r) => (
                <li
                  key={r.id}
                  onClick={() => setOpen(r)}
                  className="group flex cursor-pointer flex-col gap-1.5 px-4 py-3.5 transition-colors active:bg-muted/40"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground tabular-nums">
                    <span>{formatDateTime(r.submittedAt)}</span>
                    <span>{formatDuration(r.completionTimeSeconds ?? 0)}</span>
                  </div>
                  {collectEmail && r.respondentEmail && (
                    <div className="truncate font-mono text-xs">
                      {r.respondentEmail}
                    </div>
                  )}
                  {previewFields.length > 0 && (
                    <div className="space-y-0.5">
                      {previewFields.slice(0, 2).map((f) => (
                        <div
                          key={f.id}
                          className="text-sm"
                        >
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
                            {truncate(f.label, 28)}
                          </span>{" "}
                          {renderAnswerPreview(r.answers[f.id])}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-primary">Tap to view</span>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(r.id);
                      }}
                      aria-label="Delete response"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop / tablet table (sm+) */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 text-left font-medium">
                      Submitted
                    </th>
                    {collectEmail && (
                      <th className="px-4 py-2.5 text-left font-medium">
                        Email
                      </th>
                    )}
                    {previewFields.map((f) => (
                      <th
                        key={f.id}
                        className="px-4 py-2.5 text-left font-medium"
                      >
                        {truncate(f.label, 32)}
                      </th>
                    ))}
                    <th className="px-4 py-2.5 text-left font-medium">
                      Time
                    </th>
                    <th className="w-px px-4 py-2.5 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="group transition-colors hover:bg-muted/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground tabular-nums">
                        {formatDateTime(r.submittedAt)}
                      </td>
                      {collectEmail && (
                        <td className="whitespace-nowrap px-4 py-3 text-xs">
                          {r.respondentEmail ? (
                            <span className="font-mono">
                              {truncate(r.respondentEmail, 32)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">
                              —
                            </span>
                          )}
                        </td>
                      )}
                      {previewFields.map((f) => (
                        <td key={f.id} className="px-4 py-3 align-top">
                          {renderAnswerPreview(r.answers[f.id])}
                        </td>
                      ))}
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground tabular-nums">
                        {formatDuration(r.completionTimeSeconds ?? 0)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setOpen(r)}
                        >
                          View
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setDeleteId(r.id)}
                          aria-label="Delete response"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing{" "}
            <span className="text-foreground">
              {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, total)}
            </span>{" "}
            of <span className="text-foreground">{total.toLocaleString()}</span>
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={page <= 1 || loading}
              onClick={() => fetchPage(page - 1, range)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-1 tabular-nums">
              Page {page} / {totalPages}
            </span>
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={page >= totalPages || loading}
              onClick={() => fetchPage(page + 1, range)}
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Response details</DialogTitle>
          </DialogHeader>
          {open && (
            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2 scrollbar-thin">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-3 text-xs">
                <Meta
                  label="Submitted"
                  value={formatDateTime(open.submittedAt)}
                />
                <Meta
                  label="Completion"
                  value={formatDuration(open.completionTimeSeconds ?? 0)}
                />
                {open.respondentEmail && (
                  <Meta
                    label="Email"
                    value={open.respondentEmail}
                    mono
                  />
                )}
                {typeof open.metadata.device === "string" && (
                  <Meta
                    label="Device"
                    value={open.metadata.device as string}
                    capitalize
                  />
                )}
                {typeof open.metadata.browser === "string" && (
                  <Meta
                    label="Browser"
                    value={open.metadata.browser as string}
                  />
                )}
                {typeof (open.metadata.hidden as Record<string, string>)
                  ?.utm_source === "string" && (
                  <Meta
                    label="UTM source"
                    value={(open.metadata.hidden as Record<string, string>)
                      .utm_source}
                  />
                )}
              </div>
              <div className="space-y-2">
                {inputFields.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-lg border border-border/60 bg-card p-3"
                  >
                    <div className="text-xs font-medium text-muted-foreground">
                      {f.label}
                    </div>
                    <div className="mt-1 break-words text-sm leading-relaxed">
                      {renderAnswerFull(open.answers[f.id])}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete response?"
        description="This will permanently remove this response."
        confirmText="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function Meta({
  label,
  value,
  capitalize,
  mono,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
        {label}
      </div>
      <div
        className={
          "mt-0.5 text-foreground" +
          (capitalize ? " capitalize" : "") +
          (mono ? " font-mono text-xs" : "")
        }
      >
        {value}
      </div>
    </div>
  );
}

function renderAnswerPreview(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground/60">—</span>;
  }
  if (Array.isArray(value)) {
    return (
      <span className="line-clamp-1 text-sm">
        {truncate(value.join(", "), 60)}
      </span>
    );
  }
  return <span className="line-clamp-1 text-sm">{truncate(String(value), 60)}</span>;
}

function renderAnswerFull(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">No answer</span>;
  }
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}
