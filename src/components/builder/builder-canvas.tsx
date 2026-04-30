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
import { FilePlus2 } from "lucide-react";
import { useBuilderStore } from "@/stores/use-builder-store";
import { FieldCard } from "./field-card";
import { EmptyState } from "@/components/ui/empty-state";
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
      <div className="flex h-full items-center justify-center p-10">
        <EmptyState
          icon={<FilePlus2 className="h-5 w-5" />}
          title="Start building your form"
          description="Add fields from the palette on the left, or create your first short text question."
          action={
            <Button onClick={() => addField("short_text")}>
              Add short text
            </Button>
          }
        />
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
