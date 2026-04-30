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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="container py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Back to forms
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {formTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {responses.length} response{responses.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/forms/${formId}/builder`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit form
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/forms/${formId}/analytics`}>
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            disabled={responses.length === 0}
            variant={responses.length === 0 ? "outline" : "default"}
          >
            <a
              href={`/api/forms/${formId}/responses/export`}
              target="_blank"
              rel="noreferrer"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </a>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Responses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {responses.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Inbox className="h-5 w-5" />}
                title="No responses yet"
                description="Once people submit your form, their answers will show up here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Submitted</th>
                    {previewFields.map((f) => (
                      <th key={f.id} className="px-4 py-2 text-left">
                        {truncate(f.label, 30)}
                      </th>
                    ))}
                    <th className="px-4 py-2 text-left">Completion</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {responses.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {formatDateTime(r.submittedAt)}
                      </td>
                      {previewFields.map((f) => (
                        <td
                          key={f.id}
                          className="px-4 py-3 align-top text-sm"
                        >
                          {renderAnswerPreview(r.answers[f.id])}
                        </td>
                      ))}
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
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
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Response details</DialogTitle>
          </DialogHeader>
          {open && (
            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2 scrollbar-thin">
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <div className="font-medium text-foreground">Submitted</div>
                  <div>{formatDateTime(open.submittedAt)}</div>
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    Completion
                  </div>
                  <div>
                    {formatDuration(open.completionTimeSeconds ?? 0)}
                  </div>
                </div>
                {typeof open.metadata.device === "string" && (
                  <div>
                    <div className="font-medium text-foreground">Device</div>
                    <div className="capitalize">{open.metadata.device as string}</div>
                  </div>
                )}
                {typeof open.metadata.browser === "string" && (
                  <div>
                    <div className="font-medium text-foreground">Browser</div>
                    <div>{open.metadata.browser as string}</div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {inputFields.map((f) => (
                  <div key={f.id} className="rounded-lg border bg-muted/20 p-3">
                    <div className="text-xs font-medium text-muted-foreground">
                      {f.label}
                    </div>
                    <div className="mt-1 break-words text-sm">
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

function renderAnswerPreview(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }
  if (Array.isArray(value)) return truncate(value.join(", "), 60);
  return truncate(String(value), 60);
}

function renderAnswerFull(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">No answer</span>;
  }
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}
