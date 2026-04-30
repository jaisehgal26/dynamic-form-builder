"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Copy as CopyIcon,
  ExternalLink,
  Pencil,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { CopyButton } from "@/components/ui/copy-button";
import { CreateFormDialog } from "./create-form-dialog";
import { cn, formatRelative } from "@/lib/utils";

interface FormRow {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  status: "draft" | "published" | "archived";
  createdAt: number;
  updatedAt: number;
  publishedAt: number | null;
  responseCount: number;
  viewCount: number;
}

interface Stats {
  totalForms: number;
  totalResponses: number;
  totalViews: number;
  conversionRate: number;
}

export function DashboardClient({
  initialForms,
  stats,
}: {
  initialForms: FormRow[];
  stats: Stats;
}) {
  const router = useRouter();
  const [forms, setForms] = React.useState(initialForms);
  const [query, setQuery] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return forms;
    return forms.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        (f.description ?? "").toLowerCase().includes(q),
    );
  }, [forms, query]);

  const handleDuplicate = async (formId: string) => {
    setPendingId(formId);
    try {
      const res = await fetch(`/api/forms/${formId}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to duplicate");
      toast.success("Form duplicated");
      router.push(`/dashboard/forms/${data.form.id}/builder`);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/forms/${deleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setForms((prev) => prev.filter((f) => f.id !== deleteId));
      toast.success("Form deleted");
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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tightish">Forms</h1>
          <p className="text-sm text-muted-foreground">
            Build, publish, and analyze the forms in your workspace.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="default">
          <Plus className="h-4 w-4" />
          New form
        </Button>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={<FileText className="h-3.5 w-3.5" />}
          label="Forms"
          value={stats.totalForms.toLocaleString()}
        />
        <StatTile
          icon={<Activity className="h-3.5 w-3.5" />}
          label="Responses"
          value={stats.totalResponses.toLocaleString()}
        />
        <StatTile
          icon={<Eye className="h-3.5 w-3.5" />}
          label="Views"
          value={stats.totalViews.toLocaleString()}
        />
        <StatTile
          icon={<BarChart3 className="h-3.5 w-3.5" />}
          label="Conversion"
          value={`${stats.conversionRate}%`}
          accent
        />
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium tracking-tightish">All forms</h2>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
              {filtered.length}
            </span>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search forms…"
              className="h-9 pl-9"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-5 w-5" />}
              title={
                forms.length === 0
                  ? "No forms yet"
                  : "No forms match that search"
              }
              description={
                forms.length === 0
                  ? "Create your first form to start collecting responses."
                  : "Try a different keyword or clear the search."
              }
              action={
                forms.length === 0 ? (
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Create form
                  </Button>
                ) : null
              }
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {filtered.map((form) => (
                <FormRowItem
                  key={form.id}
                  form={form}
                  pending={pendingId === form.id}
                  onDuplicate={() => handleDuplicate(form.id)}
                  onDelete={() => setDeleteId(form.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      <CreateFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete this form?"
        description="The form and all of its responses will be permanently removed. This cannot be undone."
        confirmText="Delete form"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card px-4 py-3.5 transition-colors hover:bg-muted/40",
      )}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-muted-foreground/80">{icon}</span>
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
    </div>
  );
}

function FormRowItem({
  form,
  pending,
  onDuplicate,
  onDelete,
}: {
  form: FormRow;
  pending: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [origin, setOrigin] = React.useState("");
  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const publicUrl = `${origin}/f/${form.slug}`;

  return (
    <li className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground">
        <FileText className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/forms/${form.id}/builder`}
            className="truncate text-sm font-medium tracking-tightish hover:text-foreground/90"
          >
            {form.title}
          </Link>
          <StatusBadge status={form.status} />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>Updated {formatRelative(form.updatedAt)}</span>
          <span aria-hidden className="text-muted-foreground/40">·</span>
          <span className="tabular-nums">
            {form.responseCount.toLocaleString()} response
            {form.responseCount === 1 ? "" : "s"}
          </span>
          <span aria-hidden className="text-muted-foreground/40">·</span>
          <span className="tabular-nums">
            {form.viewCount.toLocaleString()} view
            {form.viewCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="hidden items-center gap-1 sm:flex">
        {form.status === "published" && origin && (
          <CopyButton value={publicUrl} variant="ghost" size="icon-sm" />
        )}
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
        >
          <Link href={`/dashboard/forms/${form.id}/responses`}>
            <Inbox className="h-3.5 w-3.5" />
            Responses
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
        >
          <Link href={`/dashboard/forms/${form.id}/analytics`}>
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics
          </Link>
        </Button>
        <Button asChild size="sm" variant="subtle">
          <Link href={`/dashboard/forms/${form.id}/builder`}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon-sm" variant="ghost" disabled={pending}>
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MoreHorizontal className="h-3.5 w-3.5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6} className="w-48">
          <DropdownMenuItem asChild className="sm:hidden">
            <Link href={`/dashboard/forms/${form.id}/builder`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="sm:hidden">
            <Link href={`/dashboard/forms/${form.id}/responses`}>
              <Inbox className="h-3.5 w-3.5" />
              Responses
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="sm:hidden">
            <Link href={`/dashboard/forms/${form.id}/analytics`}>
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            <CopyIcon className="h-3.5 w-3.5" />
            Duplicate
          </DropdownMenuItem>
          {form.status === "published" && (
            <DropdownMenuItem asChild>
              <a
                href={`/f/${form.slug}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open public link
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
