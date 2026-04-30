"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Cloud,
  CloudOff,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileJson,
  Inbox,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useBuilderStore } from "@/stores/use-builder-store";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CopyButton } from "@/components/ui/copy-button";
import { FieldPalette } from "./field-palette";
import { BuilderCanvas } from "./builder-canvas";
import { FieldEditorPanel } from "./field-editor-panel";
import { FormPreview } from "./form-preview";
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
}

export function BuilderShell(props: BuilderShellProps) {
  const router = useRouter();
  const init = useBuilderStore((s) => s.init);
  const fields = useBuilderStore((s) => s.fields);
  const title = useBuilderStore((s) => s.title);
  const description = useBuilderStore((s) => s.description);
  const settings = useBuilderStore((s) => s.settings);
  const theme = useBuilderStore((s) => s.theme);
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
  const updateSettings = useBuilderStore((s) => s.updateSettings);
  const updateTheme = useBuilderStore((s) => s.updateTheme);
  const importSchema = useBuilderStore((s) => s.importSchema);

  const [shareOpen, setShareOpen] = React.useState(false);
  const [schemaOpen, setSchemaOpen] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);

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
  ]);

  const snapshot = React.useMemo(
    () => ({ title, description, fields, settings, theme }),
    [title, description, fields, settings, theme],
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

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/f/${slug}`
      : `/f/${slug}`;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-background px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-8 max-w-md border-transparent bg-transparent px-2 text-sm font-semibold shadow-none hover:border-input focus-visible:border-input"
            placeholder="Untitled form"
          />
          <AutosaveIndicator
            status={autosaveStatus}
            lastSavedAt={lastSavedAt}
            isDirty={isDirty}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            asChild
            className="hidden sm:inline-flex"
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
            className="hidden sm:inline-flex"
          >
            <a href={`/dashboard/forms/${props.formId}/analytics`}>
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics
            </a>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSchemaOpen(true)}
          >
            <FileJson className="h-3.5 w-3.5" />
            Schema
          </Button>
          {status === "published" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShareOpen(true)}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Share
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
              Unpublish
            </Button>
          ) : (
            <Button size="sm" onClick={handlePublish} disabled={publishing}>
              {publishing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              Publish
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="design" className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b bg-background px-4">
          <TabsList className="my-1.5">
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent
          value="design"
          className="m-0 grid flex-1 overflow-hidden lg:grid-cols-[260px_1fr_340px]"
        >
          <aside className="hidden overflow-y-auto border-r bg-muted/20 p-4 scrollbar-thin lg:block">
            <h3 className="mb-3 text-sm font-semibold">Add fields</h3>
            <FieldPalette />
          </aside>
          <div className="overflow-y-auto p-6 scrollbar-thin">
            <div className="mx-auto max-w-2xl space-y-4">
              <div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-transparent bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:border-input focus-visible:px-3"
                  placeholder="Form title"
                />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border-transparent bg-transparent px-0 shadow-none focus-visible:border-input focus-visible:px-3"
                  rows={2}
                  placeholder="Description (optional)"
                />
              </div>
              <Separator />
              <BuilderCanvas />
              <div className="lg:hidden">
                <h3 className="mb-3 mt-6 text-sm font-semibold">Add fields</h3>
                <FieldPalette />
              </div>
            </div>
          </div>
          <aside className="hidden overflow-hidden border-l bg-muted/20 lg:block">
            <FieldEditorPanel />
          </aside>
        </TabsContent>
        <TabsContent value="preview" className="m-0 flex-1 overflow-hidden">
          <FormPreview />
        </TabsContent>
        <TabsContent
          value="settings"
          className="m-0 flex-1 overflow-y-auto bg-muted/20 p-6 scrollbar-thin"
        >
          <SettingsPanel />
        </TabsContent>
      </Tabs>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={publicUrl}
        published={status === "published"}
      />
      <SchemaDialog
        open={schemaOpen}
        onOpenChange={setSchemaOpen}
        snapshot={snapshot}
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
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <CloudOff className="h-3 w-3" />
        Save failed
      </span>
    );
  }
  if (lastSavedAt && !isDirty) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Cloud className="h-3 w-3" />
        Saved {formatRelative(lastSavedAt)}
      </span>
    );
  }
  if (isDirty) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Cloud className="h-3 w-3" />
        Pending changes
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
          <Input value={url} readOnly className="font-mono text-xs" />
          <CopyButton value={url} />
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
      onImport(parsed);
      toast.success("Schema imported");
      onOpenChange(false);
    } catch {
      toast.error("Invalid JSON");
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
          rows={16}
          className="font-mono text-xs"
        />
        <div className="flex justify-end gap-2">
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

function SettingsPanel() {
  const settings = useBuilderStore((s) => s.settings);
  const theme = useBuilderStore((s) => s.theme);
  const updateSettings = useBuilderStore((s) => s.updateSettings);
  const updateTheme = useBuilderStore((s) => s.updateTheme);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="space-y-3 rounded-xl border bg-background p-5">
        <div>
          <h3 className="text-sm font-semibold">Form settings</h3>
          <p className="text-xs text-muted-foreground">
            Control how your form behaves.
          </p>
        </div>
        <SettingRow
          label="Multi-step form"
          description="Break the form into multiple pages."
        >
          <Switch
            checked={settings.multiStep}
            onCheckedChange={(v) => updateSettings({ multiStep: !!v })}
          />
        </SettingRow>
        <SettingRow
          label="Show progress bar"
          description="Display progress to respondents."
        >
          <Switch
            checked={settings.showProgressBar}
            onCheckedChange={(v) => updateSettings({ showProgressBar: !!v })}
          />
        </SettingRow>
        <SettingRow
          label="Allow multiple submissions"
          description="Respondents can submit more than once."
        >
          <Switch
            checked={settings.allowMultipleSubmissions}
            onCheckedChange={(v) =>
              updateSettings({ allowMultipleSubmissions: !!v })
            }
          />
        </SettingRow>
        <div className="space-y-1.5">
          <Label>Thank-you message</Label>
          <Textarea
            value={settings.thankYouMessage}
            onChange={(e) =>
              updateSettings({ thankYouMessage: e.target.value })
            }
            rows={2}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Redirect URL (optional)</Label>
          <Input
            placeholder="https://example.com/thanks"
            value={settings.redirectUrl ?? ""}
            onChange={(e) =>
              updateSettings({ redirectUrl: e.target.value || undefined })
            }
          />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border bg-background p-5">
        <div>
          <h3 className="text-sm font-semibold">Theme</h3>
          <p className="text-xs text-muted-foreground">
            Customize the look of your public form.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Primary color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) =>
                  updateTheme({ primaryColor: e.target.value })
                }
                className="h-9 w-12 rounded-md border"
              />
              <Input
                value={theme.primaryColor}
                onChange={(e) =>
                  updateTheme({ primaryColor: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Background</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.backgroundColor}
                onChange={(e) =>
                  updateTheme({ backgroundColor: e.target.value })
                }
                className="h-9 w-12 rounded-md border"
              />
              <Input
                value={theme.backgroundColor}
                onChange={(e) =>
                  updateTheme({ backgroundColor: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="pr-4">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      {children}
    </div>
  );
}
