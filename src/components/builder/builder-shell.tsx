"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Check,
  CloudOff,
  Code2,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileJson,
  Inbox,
  Loader2,
  MoreHorizontal,
  Plus,
  Redo2,
  Undo2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useBuilderStore } from "@/stores/use-builder-store";
import { useDebounce } from "@/hooks/use-debounce";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CopyButton } from "@/components/ui/copy-button";
import { FieldPalette } from "./field-palette";
import { BuilderCanvas } from "./builder-canvas";
import { FieldEditorPanel } from "./field-editor-panel";
import { FormPreview } from "./form-preview";
import { SettingsPanel } from "./settings-panel";
import type {
  FormFieldDef,
  FormSettings,
  FormTheme,
} from "@/types/form";
import { formatRelative } from "@/lib/utils";

interface BuilderShellProps {
  formId: string;
  title: string;
  description: string;
  slug: string;
  status: "draft" | "published" | "archived";
  initialFields: FormFieldDef[];
  initialSettings: FormSettings;
  initialTheme: FormTheme;
  initialAccess: {
    hasPassword: boolean;
    expiresAt: number | null;
    responseLimit: number | null;
    collectEmail: boolean;
  };
}

export function BuilderShell(props: BuilderShellProps) {
  const router = useRouter();
  const init = useBuilderStore((s) => s.init);
  const fields = useBuilderStore((s) => s.fields);
  const title = useBuilderStore((s) => s.title);
  const description = useBuilderStore((s) => s.description);
  const settings = useBuilderStore((s) => s.settings);
  const theme = useBuilderStore((s) => s.theme);
  const access = useBuilderStore((s) => s.access);
  const status = useBuilderStore((s) => s.status);
  const slug = useBuilderStore((s) => s.slug);
  const isDirty = useBuilderStore((s) => s.isDirty);
  const autosaveStatus = useBuilderStore((s) => s.autosaveStatus);
  const lastSavedAt = useBuilderStore((s) => s.lastSavedAt);
  const setStatus = useBuilderStore((s) => s.setStatus);
  const setAutosaveStatus = useBuilderStore((s) => s.setAutosaveStatus);
  const markClean = useBuilderStore((s) => s.markClean);
  const setTitle = useBuilderStore((s) => s.setTitle);
  const setDescription = useBuilderStore((s) => s.setDescription);
  const importSchema = useBuilderStore((s) => s.importSchema);
  const undo = useBuilderStore((s) => s.undo);
  const redo = useBuilderStore((s) => s.redo);
  const past = useBuilderStore((s) => s.past);
  const future = useBuilderStore((s) => s.future);
  const selectField = useBuilderStore((s) => s.selectField);
  const selectedFieldId = useBuilderStore((s) => s.selectedFieldId);
  const deleteField = useBuilderStore((s) => s.deleteField);

  const [shareOpen, setShareOpen] = React.useState(false);
  const [embedOpen, setEmbedOpen] = React.useState(false);
  const [schemaOpen, setSchemaOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);

  // On non-desktop screens, auto-open the field editor when a field is
  // selected. We never auto-open on `lg+` because the editor is permanently
  // visible there.
  React.useEffect(() => {
    if (!selectedFieldId) return;
    if (typeof window === "undefined") return;
    const isLg = window.matchMedia("(min-width: 1024px)").matches;
    if (!isLg) setEditorOpen(true);
  }, [selectedFieldId]);

  React.useEffect(() => {
    init({
      formId: props.formId,
      title: props.title,
      description: props.description,
      status: props.status,
      slug: props.slug,
      fields: props.initialFields,
      settings: props.initialSettings,
      theme: props.initialTheme,
      access: {
        hasPassword: props.initialAccess.hasPassword,
        expiresAt: props.initialAccess.expiresAt,
        responseLimit: props.initialAccess.responseLimit,
        collectEmail: props.initialAccess.collectEmail,
        password: null,
        clearPassword: false,
      },
    });
  }, [
    init,
    props.formId,
    props.title,
    props.description,
    props.status,
    props.slug,
    props.initialFields,
    props.initialSettings,
    props.initialTheme,
    props.initialAccess.hasPassword,
    props.initialAccess.expiresAt,
    props.initialAccess.responseLimit,
    props.initialAccess.collectEmail,
  ]);

  const snapshot = React.useMemo(
    () => ({ title, description, fields, settings, theme, access }),
    [title, description, fields, settings, theme, access],
  );
  const debouncedSnapshot = useDebounce(snapshot, 800);

  const saveRef = React.useRef<(snap: typeof snapshot) => Promise<void>>(
    async () => {},
  );
  saveRef.current = React.useCallback(
    async (snap: typeof snapshot) => {
      setAutosaveStatus("saving");
      try {
        const res = await fetch(`/api/forms/${props.formId}/schema`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: snap.title || "Untitled form",
            description: snap.description || null,
            settings: snap.settings,
            theme: snap.theme,
            fields: snap.fields,
            access: {
              password: snap.access.password,
              clearPassword: snap.access.clearPassword,
              expiresAt: snap.access.expiresAt,
              responseLimit: snap.access.responseLimit,
              collectEmail: snap.access.collectEmail,
            },
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to save");
        }
        const data = await res.json();
        setAutosaveStatus("saved", data.savedAt ?? Date.now());
        markClean();
      } catch (err: unknown) {
        setAutosaveStatus("error");
        toast.error(err instanceof Error ? err.message : "Autosave failed");
      }
    },
    [props.formId, setAutosaveStatus, markClean],
  );

  React.useEffect(() => {
    if (!isDirty) return;
    saveRef.current(debouncedSnapshot);
  }, [debouncedSnapshot, isDirty]);

  useKeyboardShortcuts([
    { key: "z", meta: true, handler: () => undo() },
    { key: "z", meta: true, shift: true, handler: () => redo() },
    {
      key: "s",
      meta: true,
      allowInInput: true,
      handler: () => {
        if (isDirty) saveRef.current(snapshot);
        toast.success("Saved");
      },
    },
    {
      key: "Backspace",
      handler: () => {
        if (selectedFieldId) deleteField(selectedFieldId);
      },
    },
    {
      key: "Delete",
      handler: () => {
        if (selectedFieldId) deleteField(selectedFieldId);
      },
    },
    {
      key: "Escape",
      allowInInput: true,
      handler: () => {
        if (
          document.activeElement instanceof HTMLElement &&
          document.activeElement.tagName !== "BODY"
        ) {
          (document.activeElement as HTMLElement).blur();
        }
        selectField(null);
      },
    },
  ]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      if (isDirty) await saveRef.current(snapshot);
      const res = await fetch(`/api/forms/${props.formId}/publish`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish");
      setStatus("published");
      setShareOpen(true);
      toast.success("Form published");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/forms/${props.formId}/unpublish`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to unpublish");
      }
      setStatus("draft");
      toast.success("Form unpublished");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to unpublish");
    } finally {
      setPublishing(false);
    }
  };

  const [origin, setOrigin] = React.useState("");
  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const publicUrl = origin ? `${origin}/f/${slug}` : `/f/${slug}`;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-background/85 px-3 py-2 backdrop-blur sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-8 min-w-0 border-transparent bg-transparent px-2 text-sm font-medium tracking-tightish shadow-none focus-visible:border-input focus-visible:bg-background"
            placeholder="Untitled form"
          />
          <AutosaveIndicator
            status={autosaveStatus}
            lastSavedAt={lastSavedAt}
            isDirty={isDirty}
          />
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={undo}
                disabled={past.length === 0}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Undo"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (⌘Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={redo}
                disabled={future.length === 0}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Redo"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (⌘⇧Z)</TooltipContent>
          </Tooltip>
          <span className="mx-1 hidden h-4 w-px bg-border/70 lg:block" />

          {/* Desktop-only quick links */}
          <Button
            size="sm"
            variant="ghost"
            asChild
            className="hidden text-muted-foreground hover:text-foreground lg:inline-flex"
          >
            <a href={`/dashboard/forms/${props.formId}/responses`}>
              <Inbox className="h-3.5 w-3.5" />
              Responses
            </a>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            asChild
            className="hidden text-muted-foreground hover:text-foreground lg:inline-flex"
          >
            <a href={`/dashboard/forms/${props.formId}/analytics`}>
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </a>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSchemaOpen(true)}
            className="hidden text-muted-foreground hover:text-foreground lg:inline-flex"
          >
            <FileJson className="h-3.5 w-3.5" />
            Schema
          </Button>
          {status === "published" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEmbedOpen(true)}
              className="hidden text-muted-foreground hover:text-foreground lg:inline-flex"
            >
              <Code2 className="h-3.5 w-3.5" />
              Embed
            </Button>
          )}

          {/* Overflow menu for the same actions on `<lg` */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground lg:hidden"
                aria-label="More"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-52">
              <DropdownMenuItem asChild>
                <a
                  href={`/dashboard/forms/${props.formId}/responses`}
                  className="flex items-center gap-2"
                >
                  <Inbox className="h-3.5 w-3.5" />
                  Responses
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={`/dashboard/forms/${props.formId}/analytics`}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Analytics
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSchemaOpen(true)}>
                <FileJson className="h-3.5 w-3.5" />
                Schema
              </DropdownMenuItem>
              {status === "published" && (
                <DropdownMenuItem onClick={() => setEmbedOpen(true)}>
                  <Code2 className="h-3.5 w-3.5" />
                  Embed
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {status === "published" && (
            <Button
              size="sm"
              variant="subtle"
              onClick={() => setShareOpen(true)}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          )}
          {status === "published" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleUnpublish}
              disabled={publishing}
            >
              {publishing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Unpublish</span>
            </Button>
          ) : (
            <Button size="sm" onClick={handlePublish} disabled={publishing}>
              {publishing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Publish</span>
            </Button>
          )}
        </div>
      </div>

      <Tabs
        defaultValue="design"
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="border-b border-border/60 bg-background px-3 sm:px-4">
          <TabsList className="my-1.5 bg-muted/50">
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="design"
          className="m-0 grid flex-1 overflow-hidden lg:grid-cols-[240px_1fr_320px]"
        >
          {/* Left palette — desktop */}
          <aside className="hidden overflow-y-auto border-r border-border/60 bg-subtle/40 px-3 py-4 scrollbar-thin lg:block">
            <h3 className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Add field
            </h3>
            <FieldPalette />
          </aside>

          {/* Canvas */}
          <div className="overflow-y-auto bg-muted/30 px-4 py-6 scrollbar-thin sm:px-6 sm:py-8">
            <div className="mx-auto max-w-2xl space-y-5 sm:space-y-6">
              <div className="space-y-1.5">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-auto border-transparent bg-transparent px-0 py-0 text-2xl font-semibold tracking-tightish shadow-none focus-visible:bg-transparent focus-visible:ring-0 sm:text-2xl"
                  placeholder="Untitled form"
                />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-0 resize-none border-transparent bg-transparent px-0 py-0 text-sm leading-relaxed text-muted-foreground shadow-none focus-visible:bg-transparent focus-visible:ring-0"
                  rows={1}
                  placeholder="Add a description (optional). Tip: use {{name}} to greet visitors."
                />
              </div>
              <BuilderCanvas />
            </div>
          </div>

          {/* Right inspector — desktop */}
          <aside className="hidden overflow-hidden border-l border-border/60 bg-subtle/40 lg:block">
            <FieldEditorPanel />
          </aside>
        </TabsContent>

        <TabsContent value="preview" className="m-0 flex-1 overflow-hidden">
          <FormPreview />
        </TabsContent>

        <TabsContent
          value="settings"
          className="m-0 flex-1 overflow-y-auto bg-muted/30 px-4 py-6 scrollbar-thin sm:px-6 sm:py-8"
        >
          <SettingsPanel />
        </TabsContent>
      </Tabs>

      {/* Mobile/tablet floating "Add field" button + palette sheet */}
      <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-5 right-5 z-20 h-12 rounded-full px-5 shadow-lg lg:hidden"
            aria-label="Add field"
          >
            <Plus className="h-4 w-4" />
            Add field
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-72 overflow-y-auto bg-subtle/95 p-0 scrollbar-thin"
        >
          <SheetHeader>
            <SheetTitle>Add field</SheetTitle>
          </SheetHeader>
          <div
            className="px-3 pb-6"
            onClick={(e) => {
              // Auto-close after a palette button is tapped
              if ((e.target as HTMLElement).closest("button")) {
                setTimeout(() => setPaletteOpen(false), 80);
              }
            }}
          >
            <FieldPalette />
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile/tablet field editor — bottom sheet */}
      <Sheet
        open={editorOpen && selectedFieldId !== null}
        onOpenChange={(o) => {
          setEditorOpen(o);
          if (!o) selectField(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-hidden p-0 lg:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Edit field</SheetTitle>
          </SheetHeader>
          <div className="h-full max-h-[85vh] overflow-hidden">
            <FieldEditorPanel />
          </div>
        </SheetContent>
      </Sheet>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={publicUrl}
        published={status === "published"}
      />
      <EmbedDialog
        open={embedOpen}
        onOpenChange={setEmbedOpen}
        url={publicUrl}
      />
      <SchemaDialog
        open={schemaOpen}
        onOpenChange={setSchemaOpen}
        snapshot={{
          title: snapshot.title,
          description: snapshot.description,
          fields: snapshot.fields,
          settings: snapshot.settings,
          theme: snapshot.theme,
        }}
        onImport={(s) => importSchema(s)}
      />
    </div>
  );
}

function AutosaveIndicator({
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
        <span className="hidden sm:inline">Save failed</span>
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
        <span className="hidden sm:inline">Unsaved</span>
      </span>
    );
  }
  return null;
}

function ShareDialog({
  open,
  onOpenChange,
  url,
  published,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  url: string;
  published: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share your form</DialogTitle>
          <DialogDescription>
            {published
              ? "Anyone with this link can view and submit your form."
              : "Publish your form to get a shareable link."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            value={url}
            readOnly
            className="h-10 min-w-0 flex-1 font-mono text-xs"
          />
          <CopyButton value={url} size="icon" />
        </div>
        {published && (
          <Button asChild variant="outline" className="w-full">
            <a href={url} target="_blank" rel="noreferrer noopener">
              <ExternalLink className="h-3.5 w-3.5" />
              Open form in new tab
            </a>
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EmbedDialog({
  open,
  onOpenChange,
  url,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  url: string;
}) {
  const snippet = `<iframe src="${url}" width="100%" height="700" frameborder="0" style="border:0; max-width: 720px;"></iframe>`;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Embed this form</DialogTitle>
          <DialogDescription>
            Copy and paste this snippet into your website.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-2">
          <Textarea
            value={snippet}
            readOnly
            rows={3}
            className="min-w-0 flex-1 font-mono text-xs leading-relaxed"
          />
          <CopyButton value={snippet} size="icon" />
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: For dynamic prefill, append query params to the iframe src — e.g.{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            ?name=Jai&utm_source=blog
          </code>
        </p>
      </DialogContent>
    </Dialog>
  );
}

function SchemaDialog({
  open,
  onOpenChange,
  snapshot,
  onImport,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  snapshot: {
    title: string;
    description: string;
    fields: FormFieldDef[];
    settings: FormSettings;
    theme: FormTheme;
  };
  onImport: (s: {
    title?: string;
    description?: string;
    settings?: FormSettings;
    theme?: FormTheme;
    fields?: FormFieldDef[];
  }) => void;
}) {
  const [text, setText] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setText(JSON.stringify(snapshot, null, 2));
    }
  }, [open, snapshot]);

  const handleImport = () => {
    try {
      const parsed = JSON.parse(text);
      if (parsed.fields && !Array.isArray(parsed.fields)) {
        throw new Error("`fields` must be an array.");
      }
      onImport(parsed);
      toast.success("Schema imported");
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${snapshot.title || "form"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schema</DialogTitle>
          <DialogDescription>
            Export your form as JSON, or paste a schema to import.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          className="max-h-[55vh] font-mono text-xs leading-relaxed"
        />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
          <Button onClick={handleImport}>
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
