"use client";

import * as React from "react";
import {
  ArrowLeft,
  BarChart3,
  Download,
  Inbox,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  answers: Record<string, unknown>;
  metadata: Record<string, unknown>;
  startedAt: number | null;
  submittedAt: number;
  completionTimeSeconds: number | null;
}

export function ResponsesClient({
  formId,
  formTitle,
  fields,
  responses: initial,
}: {
  formId: string;
  formTitle: string;
  fields: FormFieldDef[];
  responses: ResponseRow[];
}) {
  const router = useRouter();
  const [responses, setResponses] = React.useState(initial);
  const [open, setOpen] = React.useState<ResponseRow | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const inputFields = fields.filter(
    (f) => f.type !== "section_heading" && f.type !== "page_break",
  );
  const previewFields = inputFields.slice(0, 3);

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
      toast.success("Response deleted");
      setDeleteId(null);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Back to forms
          </Link>
          <h1 className="text-2xl font-semibold tracking-tightish">
            {formTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {responses.length.toLocaleString()} response
            {responses.length === 1 ? "" : "s"}
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
            variant={responses.length === 0 ? "outline" : "default"}
          >
            <a
              href={`/api/forms/${formId}/responses/export`}
              target="_blank"
              rel="noreferrer"
              aria-disabled={responses.length === 0}
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </a>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs">
        {responses.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-5 w-5" />}
            title="No responses yet"
            description="Once people submit your form, their answers will show up here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 text-left font-medium">Submitted</th>
                  {previewFields.map((f) => (
                    <th
                      key={f.id}
                      className="px-4 py-2.5 text-left font-medium"
                    >
                      {truncate(f.label, 32)}
                    </th>
                  ))}
                  <th className="px-4 py-2.5 text-left font-medium">Time</th>
                  <th className="w-px px-4 py-2.5 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {responses.map((r) => (
                  <tr
                    key={r.id}
                    className="group transition-colors hover:bg-muted/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground tabular-nums">
                      {formatDateTime(r.submittedAt)}
                    </td>
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
        )}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Response details</DialogTitle>
          </DialogHeader>
          {open && (
            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2 scrollbar-thin">
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-3 text-xs">
                <Meta label="Submitted" value={formatDateTime(open.submittedAt)} />
                <Meta
                  label="Completion"
                  value={formatDuration(open.completionTimeSeconds ?? 0)}
                />
                {typeof open.metadata.device === "string" && (
                  <Meta
                    label="Device"
                    value={(open.metadata.device as string) || "—"}
                    capitalize
                  />
                )}
                {typeof open.metadata.browser === "string" && (
                  <Meta
                    label="Browser"
                    value={(open.metadata.browser as string) || "—"}
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
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
        {label}
      </div>
      <div className={"mt-0.5 text-foreground" + (capitalize ? " capitalize" : "")}>
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
