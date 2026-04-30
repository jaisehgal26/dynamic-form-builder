"use client";

import * as React from "react";
import { useBuilderStore } from "@/stores/use-builder-store";
import { groupFieldsByStep } from "@/lib/form-helpers";
import { PublicFormRenderer } from "@/components/public-form/public-form-renderer";

export function FormPreview() {
  const title = useBuilderStore((s) => s.title);
  const description = useBuilderStore((s) => s.description);
  const fields = useBuilderStore((s) => s.fields);
  const settings = useBuilderStore((s) => s.settings);
  const theme = useBuilderStore((s) => s.theme);
  const slug = useBuilderStore((s) => s.slug);

  const stepCount = groupFieldsByStep(fields).size;

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <div className="flex items-center justify-between border-b border-border/60 bg-background/60 px-4 py-2 text-xs text-muted-foreground backdrop-blur">
        <span className="font-medium uppercase tracking-wider text-muted-foreground/70">
          Preview
        </span>
        <span className="tabular-nums">
          {stepCount} step{stepCount === 1 ? "" : "s"} · {fields.length} fields
        </span>
      </div>
      <div className="flex-1 overflow-auto scrollbar-thin">
        <div className="mx-auto max-w-2xl px-4 py-10">
          <PublicFormRenderer
            preview
            form={{
              id: "preview",
              slug,
              title: title || "Untitled form",
              description: description || null,
              settings,
              theme,
              fields,
              collectEmail: false,
            }}
          />
        </div>
      </div>
    </div>
  );
}
