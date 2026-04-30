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
    <div className="flex h-full flex-col">
      <div className="border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        Preview · {stepCount} step{stepCount === 1 ? "" : "s"} · {fields.length} fields
      </div>
      <div className="flex-1 overflow-auto bg-zinc-50">
        <div className="mx-auto max-w-2xl px-4 py-8">
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
            }}
          />
        </div>
      </div>
    </div>
  );
}
