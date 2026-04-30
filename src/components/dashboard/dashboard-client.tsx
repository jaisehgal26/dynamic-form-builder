"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Copy as CopyIcon,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatRelative } from "@/lib/utils";

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
    <div className="container py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Forms</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build, publish, and analyze your forms.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New form
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label="Total forms"
          value={stats.totalForms.toString()}
        />
        <StatCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Total responses"
          value={stats.totalResponses.toLocaleString()}
        />
        <StatCard
          icon={<Eye className="h-4 w-4" />}
          label="Total views"
          value={stats.totalViews.toLocaleString()}
        />
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Conversion rate"
          value={`${stats.conversionRate}%`}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <CardTitle className="text-base">All forms</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search forms…"
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<FileText className="h-5 w-5" />}
                title={forms.length === 0 ? "Create your first form" : "No matches"}
                description={
                  forms.length === 0
                    ? "Forms you create will appear here. Get started in under a minute."
                    : "No forms match that search. Try a different keyword."
                }
                action={
                  forms.length === 0 ? (
                    <Button onClick={() => setCreateOpen(true)}>
                      <Plus className="h-4 w-4" />
                      New form
                    </Button>
                  ) : null
                }
              />
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((form) => (
                <FormRowItem
                  key={form.id}
                  form={form}
                  pending={pendingId === form.id}
                  onDuplicate={() => handleDuplicate(form.id)}
                  onDelete={() => setDeleteId(form.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete form?"
        description="This will permanently delete the form and all its responses. This cannot be undone."
        confirmText="Delete form"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span>{icon}</span>
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">
          {value}
        </div>
      </CardContent>
    </Card>
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
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/f/${form.slug}`
      : `/f/${form.slug}`;

  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/forms/${form.id}/builder`}
            className="truncate text-sm font-semibold hover:underline"
          >
            {form.title}
          </Link>
          <StatusBadge status={form.status} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>Updated {formatRelative(form.updatedAt)}</span>
          <span className="hidden sm:inline">·</span>
          <span>{form.responseCount} responses</span>
          <span className="hidden sm:inline">·</span>
          <span>{form.viewCount} views</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {form.status === "published" && (
          <CopyButton value={publicUrl} variant="ghost" size="icon-sm" />
        )}
        <Button asChild size="sm" variant="ghost">
          <Link href={`/dashboard/forms/${form.id}/responses`}>Responses</Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href={`/dashboard/forms/${form.id}/analytics`}>Analytics</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/dashboard/forms/${form.id}/builder`}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost" disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={onDuplicate}>
              <CopyIcon className="h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            {form.status === "published" && (
              <DropdownMenuItem asChild>
                <a
                  href={`/f/${form.slug}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open public form
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
