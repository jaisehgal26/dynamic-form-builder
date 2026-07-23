"use client";

import * as React from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Sparkles } from "lucide-react";
import { useBuilderStore } from "@/stores/use-builder-store";
import { FieldCard } from "./field-card";
import { Button } from "@/components/ui/button";

export function BuilderCanvas() {
  const fields = useBuilderStore((s) => s.fields);
  const selectedFieldId = useBuilderStore((s) => s.selectedFieldId);
  const reorderFields = useBuilderStore((s) => s.reorderFields);
  const addField = useBuilderStore((s) => s.addField);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = fields.map((f) => f.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    reorderFields(next);
  };

  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-background/40 px-6 py-16 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-medium tracking-tightish">
            Start building your form
          </h3>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Pick a field type from the palette, or add a quick short-text
            question to begin.
          </p>
        </div>
        <Button size="sm" onClick={() => addField("short_text")}>
          Add short text
        </Button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={fields.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {fields.map((field, idx) => (
            <FieldCard
              key={field.id}
              field={field}
              index={idx}
              selected={selectedFieldId === field.id}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
