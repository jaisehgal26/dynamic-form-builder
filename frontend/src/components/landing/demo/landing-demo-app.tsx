"use client";

import * as React from "react";
import {
  BarChart3,
  Check,
  CloudOff,
  Inbox,
  Loader2,
  Share2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useBuilderStore } from "@/stores/use-builder-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/ui/status-badge";
import { FieldPalette } from "@/components/builder/field-palette";
import { BuilderCanvas } from "@/components/builder/builder-canvas";
import { FieldEditorPanel } from "@/components/builder/field-editor-panel";
import { FormPreview } from "@/components/builder/form-preview";
import { DemoAnalyticsPanel } from "./demo-analytics-panel";
import { createDemoFields, DEMO_SETTINGS, DEMO_THEME } from "./demo-data";
import { formatRelative } from "@/lib/utils";

export function LandingDemoApp() {
  const init = useBuilderStore((s) => s.init);
  const title = useBuilderStore((s) => s.title);
  const setTitle = useBuilderStore((s) => s.setTitle);
  const status = useBuilderStore((s) => s.status);
  const setStatus = useBuilderStore((s) => s.setStatus);
  const isDirty = useBuilderStore((s) => s.isDirty);
  const markClean = useBuilderStore((s) => s.markClean);
  const setAutosaveStatus = useBuilderStore((s) => s.setAutosaveStatus);
  const autosaveStatus = useBuilderStore((s) => s.autosaveStatus);
  const lastSavedAt = useBuilderStore((s) => s.lastSavedAt);
  const fields = useBuilderStore((s) => s.fields);

  const [publishing, setPublishing] = React.useState(false);
  const [tab, setTab] = React.useState("design");

  React.useEffect(() => {
    init({
      formId: "demo-form",
      title: "Customer onboarding",
      description: "Tell us a bit about your team so we can tailor your setup.",
      status: "draft",
      slug: "customer-onboarding",
      fields: createDemoFields(),
      settings: DEMO_SETTINGS,
      theme: DEMO_THEME,
      access: {
        hasPassword: false,
        expiresAt: null,
        responseLimit: null,
        collectEmail: false,
        password: null,
        clearPassword: false,
      },
    });
    setAutosaveStatus("saved", Date.now());
    markClean();
  }, [init, markClean, setAutosaveStatus]);

  React.useEffect(() => {
    if (!isDirty) return;
    setAutosaveStatus("saving");
    const timer = window.setTimeout(() => {
      markClean();
      setAutosaveStatus("saved", Date.now());
    }, 700);
    return () => window.clearTimeout(timer);
  }, [fields, title, isDirty, markClean, setAutosaveStatus]);

  const handlePublish = async () => {
    setPublishing(true);
    await new Promise((r) => setTimeout(r, 600));
    setStatus("published");
    toast.success("Form published");
    setPublishing(false);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl shadow-primary/10 ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/20 px-3 py-2 sm:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 min-w-0 flex-1 border-transparent bg-transparent px-2 text-sm font-medium tracking-tightish shadow-none focus-visible:border-input focus-visible:bg-background"
              placeholder="Untitled form"
            />
            <DemoAutosaveIndicator
              status={autosaveStatus}
              lastSavedAt={lastSavedAt}
              isDirty={isDirty}
            />
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <StatusBadge status={status} />
            <ToolbarHint
              label="Responses"
              hint="Sign up free to collect, filter, and export responses."
            >
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled
                className="hidden text-muted-foreground lg:inline-flex"
              >
                <Inbox className="h-3.5 w-3.5" />
                Responses
              </Button>
            </ToolbarHint>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="hidden text-muted-foreground lg:inline-flex"
              onClick={() => setTab("analytics")}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </Button>
            {status === "published" ? (
              <ToolbarHint
                label="Share"
                hint="Create an account to publish and share a live link."
              >
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled
                  className="pointer-events-auto"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </Button>
              </ToolbarHint>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={publishing}
                onClick={handlePublish}
              >
                {publishing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Publish
              </Button>
            )}
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="flex flex-col">
          <div className="border-b border-border/60 px-3 sm:px-4">
            <TabsList className="h-9 bg-transparent p-0">
              <TabsTrigger
                value="design"
                className="rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Design
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Preview
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="rounded-none border-b-2 border-transparent px-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="design" className="mt-0">
            <div className="grid h-[min(520px,58vh)] grid-cols-1 lg:grid-cols-[200px_1fr_260px]">
              <aside className="hidden overflow-y-auto border-r border-border/60 bg-muted/15 p-3 lg:block">
                <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Add fields
                </p>
                <FieldPalette />
              </aside>
              <div className="overflow-y-auto bg-subtle/30 p-4 scrollbar-thin">
                <div className="mx-auto max-w-xl">
                  <BuilderCanvas />
                </div>
              </div>
              <aside className="hidden overflow-hidden border-l border-border/60 bg-background lg:block">
                <FieldEditorPanel />
              </aside>
            </div>
            <p className="border-t border-border/60 bg-muted/10 px-4 py-2 text-center text-[11px] text-muted-foreground lg:hidden">
              Drag fields on canvas · Tap a field to edit on desktop
            </p>
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
          <div className="h-[min(520px,58vh)] overflow-hidden">
            <FormPreview inheritSurface />
          </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <div className="h-[min(520px,58vh)] overflow-y-auto scrollbar-thin">
              <DemoAnalyticsPanel compact />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

function ToolbarHint({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[220px] text-center">
        <p className="font-medium">{label}</p>
        <p className="mt-0.5 text-primary-foreground/80">{hint}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function DemoAutosaveIndicator({
  status,
  lastSavedAt,
  isDirty,
}: {
  status: "idle" | "saving" | "saved" | "error";
  lastSavedAt: number | null;
  isDirty: boolean;
}) {
  if (status === "saving") {
    return (
      <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-destructive">
        <CloudOff className="h-3 w-3" />
      </span>
    );
  }
  if (lastSavedAt && !isDirty) {
    return (
      <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        <Check className="h-3 w-3 text-success" />
        Saved {formatRelative(lastSavedAt)}
      </span>
    );
  }
  if (isDirty) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      </span>
    );
  }
  return null;
}
