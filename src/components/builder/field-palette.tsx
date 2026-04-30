"use client";

import { Plus } from "lucide-react";
import { useBuilderStore } from "@/stores/use-builder-store";
import {
  FIELD_TYPE_LABELS,
  type FieldType,
} from "@/types/form";
import { FieldIcon } from "./field-icons";
import { cn } from "@/lib/utils";

const GROUPS: { title: string; types: FieldType[] }[] = [
  {
    title: "Text",
    types: ["short_text", "long_text", "email", "phone", "number", "date"],
  },
  {
    title: "Choice",
    types: ["single_choice", "multiple_choice", "dropdown"],
  },
  {
    title: "Rating",
    types: ["rating", "nps"],
  },
  {
    title: "Layout",
    types: ["section_heading", "page_break", "file_upload"],
  },
];

export function FieldPalette() {
  const addField = useBuilderStore((s) => s.addField);

  return (
    <div className="space-y-5">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.title}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {group.types.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addField(type)}
                className={cn(
                  "group flex items-center gap-2 rounded-md border bg-background p-2 text-left text-xs transition-colors",
                  "hover:border-primary/40 hover:bg-muted/50",
                )}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                  <FieldIcon type={type} className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 truncate font-medium">
                  {FIELD_TYPE_LABELS[type]}
                </span>
                <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
