"use client";

import * as React from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Download, GripVertical, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PublicFormRenderer } from "@/components/public-form/public-form-renderer";
import { FieldRenderer } from "@/components/public-form/field-renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoAnalyticsPanel } from "./demo-analytics-panel";
import {
  DEMO_PASSWORD,
  DEMO_RESPONSE_ROWS,
  DEMO_SETTINGS,
  DEMO_THEME,
  createDemoFields,
  createDemoPublicForm,
} from "./demo-data";
import type { FormFieldDef } from "@/types/form";
import { cn, formatRelative } from "@/lib/utils";
import { FieldIcon } from "@/components/builder/field-icons";
import { FIELD_TYPE_LABELS } from "@/types/form";

export function FeatureDemo({ index }: { index: number }) {
  const demos = [
    <BuilderFeatureDemo key="builder" />,
    <LogicFeatureDemo key="logic" />,
    <StepsFeatureDemo key="steps" />,
    <AnalyticsFeatureDemo key="analytics" />,
    <AutosaveFeatureDemo key="autosave" />,
    <BrandFeatureDemo key="brand" />,
    <PasswordFeatureDemo key="password" />,
    <ExportFeatureDemo key="export" />,
  ];
  return (
    <div className="h-full w-full animate-fade-in">{demos[index]}</div>
  );
}

function DemoShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[320px] w-full flex-col overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

function BuilderFeatureDemo() {
  const [fields, setFields] = React.useState(() =>
    createDemoFields().slice(0, 4),
  );
  const [selectedId, setSelectedId] = React.useState<string | null>("demo_email");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = fields.map((f) => f.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const nextIds = arrayMove(ids, oldIndex, newIndex);
    setFields((prev) =>
      nextIds.map((id, i) => {
        const f = prev.find((x) => x.id === id)!;
        return { ...f, position: i };
      }),
    );
  };

  return (
    <DemoShell>
      <div className="border-b border-border/60 bg-muted/20 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Try it — drag to reorder
      </div>
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {fields.map((field) => (
                <DemoSortableField
                  key={field.id}
                  field={field}
                  selected={selectedId === field.id}
                  onSelect={() => setSelectedId(field.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </DemoShell>
  );
}

function DemoSortableField({
  field,
  selected,
  onSelect,
}: {
  field: FormFieldDef;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      onClick={onSelect}
      className={cn(
        "group relative flex items-start gap-2 rounded-xl border bg-card p-3 transition-all",
        selected
          ? "border-primary/40 shadow-[0_0_0_3px_hsl(var(--ring)/0.12)]"
          : "border-border/60 hover:border-border",
        isDragging && "opacity-60",
      )}
    >
      {selected && (
        <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-primary" />
      )}
      <button
        type="button"
        className="mt-0.5 cursor-grab text-muted-foreground/60 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <FieldIcon type={field.type} className="h-3 w-3" />
          {FIELD_TYPE_LABELS[field.type]}
        </div>
        <p className="mt-1 text-sm font-medium">{field.label}</p>
      </div>
    </div>
  );
}

function LogicFeatureDemo() {
  const form = React.useMemo(
    () =>
      createDemoPublicForm(createDemoFields().slice(0, 4), {
        settings: { ...DEMO_SETTINGS, multiStep: false, showProgressBar: false },
      }),
    [],
  );

  return (
    <DemoShell className="overflow-y-auto">
      <div className="border-b border-border/60 bg-muted/20 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Select &quot;Manager&quot; to reveal team size
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <PublicFormRenderer preview inheritSurface form={form} />
      </div>
    </DemoShell>
  );
}

function StepsFeatureDemo() {
  const form = React.useMemo(
    () => createDemoPublicForm(createDemoFields()),
    [],
  );

  return (
    <DemoShell className="overflow-y-auto">
      <div className="border-b border-border/60 bg-muted/20 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Multi-step — use Continue to advance
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <PublicFormRenderer preview inheritSurface form={form} />
      </div>
    </DemoShell>
  );
}

function AnalyticsFeatureDemo() {
  return (
    <DemoShell className="overflow-y-auto">
      <DemoAnalyticsPanel compact />
    </DemoShell>
  );
}

function AutosaveFeatureDemo() {
  const [title, setTitle] = React.useState("Customer onboarding");
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved">("saved");
  const [savedAt, setSavedAt] = React.useState(() => Date.now());

  React.useEffect(() => {
    setStatus("saving");
    const t = window.setTimeout(() => {
      setStatus("saved");
      setSavedAt(Date.now());
    }, 500);
    return () => window.clearTimeout(t);
  }, [title]);

  return (
    <DemoShell>
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-3 py-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Autosave
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {status === "saving" ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Check className="h-3 w-3 text-success" />
              Saved {formatRelative(savedAt)}
            </>
          )}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-3 p-6">
        <Label htmlFor="demo-title">Form title</Label>
        <Input
          id="demo-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-base"
        />
        <p className="text-xs text-muted-foreground">
          Edits save automatically — just like the real builder.
        </p>
      </div>
    </DemoShell>
  );
}

function BrandFeatureDemo() {
  const [primaryColor, setPrimaryColor] = React.useState("#6366f1");
  const form = React.useMemo(
    () =>
      createDemoPublicForm(
        [
          {
            id: "brand_name",
            type: "short_text",
            label: "Your name",
            required: true,
            position: 0,
            step: 1,
            config: {},
            validation: {},
            logic: [],
            placeholder: "Alex",
          },
          {
            id: "brand_rating",
            type: "rating",
            label: "How was your experience?",
            required: false,
            position: 1,
            step: 1,
            config: { maxRating: 5, ratingIcon: "star" },
            validation: {},
            logic: [],
          },
        ],
        {
          title: "Product feedback",
          settings: { ...DEMO_SETTINGS, multiStep: false, showProgressBar: false },
          theme: { ...DEMO_THEME, primaryColor },
        },
      ),
    [primaryColor],
  );

  return (
    <DemoShell className="overflow-y-auto">
      <div className="flex items-center gap-3 border-b border-border/60 bg-muted/20 px-3 py-2">
        <Label htmlFor="brand-color" className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Brand color
        </Label>
        <input
          id="brand-color"
          type="color"
          value={primaryColor}
          onChange={(e) => setPrimaryColor(e.target.value)}
          className="h-7 w-10 cursor-pointer rounded border border-border/60 bg-background"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <PublicFormRenderer preview inheritSurface form={form} />
      </div>
    </DemoShell>
  );
}

function PasswordFeatureDemo() {
  const [password, setPassword] = React.useState("");
  const [unlocked, setUnlocked] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    window.setTimeout(() => {
      if (password === DEMO_PASSWORD) {
        setUnlocked(true);
        toast.success("Access granted");
      } else {
        setError("Incorrect password. Hint: welcome");
      }
      setLoading(false);
    }, 400);
  };

  if (unlocked) {
    const field = createDemoFields()[0];
    return (
      <DemoShell>
        <div className="flex flex-1 flex-col justify-center p-6">
          <FieldRenderer
            field={field}
            value=""
            onChange={() => {}}
            primaryColor={DEMO_THEME.primaryColor}
          />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Form unlocked — try password: <code className="rounded bg-muted px-1">welcome</code>
          </p>
        </div>
      </DemoShell>
    );
  }

  return (
    <DemoShell>
      <div className="flex flex-1 flex-col justify-center p-6">
        <div className="mx-auto w-full max-w-xs text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <h4 className="text-sm font-semibold">Protected form</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter <strong>welcome</strong> to continue
          </p>
        </div>
        <form onSubmit={onSubmit} className="mx-auto mt-4 w-full max-w-xs space-y-2">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="h-10"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || !password}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
          </Button>
        </form>
      </div>
    </DemoShell>
  );
}

function ExportFeatureDemo() {
  const [exported, setExported] = React.useState(false);

  const handleExport = () => {
    setExported(true);
    toast.success("CSV downloaded", {
      description: "customer-onboarding-responses.csv",
    });
  };

  return (
    <DemoShell>
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-3 py-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Responses
        </span>
        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={handleExport}>
          <Download className="h-3 w-3" />
          Export CSV
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-3 sm:p-4">
        <table className="w-full table-fixed text-left text-[11px] sm:text-xs">
          <thead>
            <tr className="border-b border-border/60 text-muted-foreground">
              <th className="w-[28%] pb-2 pr-2 font-medium">Name</th>
              <th className="w-[40%] pb-2 pr-2 font-medium">Email</th>
              <th className="w-[20%] pb-2 pr-2 font-medium">Role</th>
              <th className="w-[12%] pb-2 font-medium">NPS</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_RESPONSE_ROWS.map((row) => (
              <tr key={row.email} className="border-b border-border/40">
                <td className="truncate py-2 pr-2">{row.name}</td>
                <td className="truncate py-2 pr-2 text-muted-foreground">{row.email}</td>
                <td className="truncate py-2 pr-2">{row.role}</td>
                <td className="py-2 tabular-nums">{row.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {exported && (
          <p className="mt-3 text-center text-[11px] text-success">
            ✓ Export ready — your data stays yours
          </p>
        )}
      </div>
    </DemoShell>
  );
}
