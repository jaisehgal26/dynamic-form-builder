"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import { useBuilderStore } from "@/stores/use-builder-store";
import type { FormFieldDef } from "@/types/form";
import { FIELD_TYPE_LABELS } from "@/types/form";
import { Button } from "@/components/ui/button";
import { FieldIcon } from "./field-icons";
import { cn } from "@/lib/utils";

interface FieldCardProps {
  field: FormFieldDef;
  index: number;
  selected: boolean;
}

export function FieldCard({ field, index, selected }: FieldCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const selectField = useBuilderStore((s) => s.selectField);
  const updateField = useBuilderStore((s) => s.updateField);
  const duplicateField = useBuilderStore((s) => s.duplicateField);
  const deleteField = useBuilderStore((s) => s.deleteField);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isLayout =
    field.type === "section_heading" || field.type === "page_break";

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => selectField(field.id)}
      className={cn(
        "group relative flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "hover:border-zinc-300",
        isDragging && "opacity-60 shadow-lg",
      )}
    >
      <button
        type="button"
        className="mt-1 cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FieldIcon type={field.type} className="h-3.5 w-3.5" />
          <span>{FIELD_TYPE_LABELS[field.type]}</span>
          <span>·</span>
          <span>Step {field.step}</span>
          <span>·</span>
          <span>#{index + 1}</span>
          {field.required && (
            <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
              Required
            </span>
          )}
        </div>

        {field.type === "page_break" ? (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span className="rounded-full border px-2 py-0.5">Page break</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        ) : (
          <>
            <AutoGrowTextarea
              value={field.label}
              onChange={(v) =>
                updateField(field.id, { label: v || "Untitled question" })
              }
              placeholder="Question"
              className={cn(
                "mt-1.5 w-full resize-none border-0 bg-transparent p-0 text-sm font-semibold leading-snug outline-none placeholder:text-muted-foreground/60 focus:ring-0",
                field.type === "section_heading" && "text-base",
              )}
            />
            {!isLayout && (
              <AutoGrowTextarea
                value={field.description ?? ""}
                onChange={(v) =>
                  updateField(field.id, { description: v })
                }
                placeholder="Description (optional)"
                className="mt-0.5 w-full resize-none border-0 bg-transparent p-0 text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-0"
              />
            )}
            {!isLayout && (
              <div className="mt-3">
                <FieldPreviewControl field={field} />
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            duplicateField(field.id);
          }}
          aria-label="Duplicate"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            deleteField(field.id);
          }}
          aria-label="Delete"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.preventDefault();
      }}
      className={className}
    />
  );
}

function FieldPreviewControl({ field }: { field: FormFieldDef }) {
  switch (field.type) {
    case "long_text":
      return (
        <div className="h-16 rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {field.placeholder || "Type your answer…"}
        </div>
      );
    case "single_choice":
    case "multiple_choice":
      return (
        <div className="space-y-1.5">
          {(field.config.options ?? []).slice(0, 4).map((opt) => (
            <div
              key={opt.id}
              className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs"
            >
              <span
                className={cn(
                  "h-3 w-3 shrink-0 border",
                  field.type === "single_choice" ? "rounded-full" : "rounded-sm",
                )}
              />
              <span className="truncate">{opt.label}</span>
            </div>
          ))}
        </div>
      );
    case "dropdown":
      return (
        <div className="rounded-md border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
          {field.config.options?.[0]?.label ?? "Select an option"}
        </div>
      );
    case "rating": {
      const max = field.config.maxRating ?? 5;
      return (
        <div className="flex items-center gap-1">
          {Array.from({ length: max }).map((_, i) => (
            <span
              key={i}
              className="text-muted-foreground"
              aria-hidden
            >
              ★
            </span>
          ))}
        </div>
      );
    }
    case "nps":
      return (
        <div className="flex items-center gap-1">
          {Array.from({ length: 11 }).map((_, i) => (
            <span
              key={i}
              className="flex h-6 w-6 items-center justify-center rounded border text-[11px] text-muted-foreground"
            >
              {i}
            </span>
          ))}
        </div>
      );
    case "date":
      return (
        <div className="rounded-md border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
          mm / dd / yyyy
        </div>
      );
    case "file_upload":
      return (
        <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground">
          Upload a file
        </div>
      );
    default:
      return (
        <div className="rounded-md border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
          {field.placeholder || "Type your answer…"}
        </div>
      );
  }
}
