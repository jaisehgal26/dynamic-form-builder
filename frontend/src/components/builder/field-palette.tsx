"use client";

import { useBuilderStore } from "@/stores/use-builder-store";
import {
  FIELD_TYPE_LABELS,
  type FieldType,
} from "@/types/form";
import { FieldIcon } from "./field-icons";

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
          <h4 className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {group.title}
          </h4>
          <div className="space-y-0.5">
            {group.types.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addField(type)}
                className="group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-foreground/80 transition-colors hover:bg-background hover:text-foreground"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground ring-1 ring-border/60 transition-colors group-hover:text-primary group-hover:ring-primary/30">
                  <FieldIcon type={type} className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 truncate">
                  {FIELD_TYPE_LABELS[type]}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
