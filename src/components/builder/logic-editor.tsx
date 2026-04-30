"use client";

import { Plus, Trash2 } from "lucide-react";
import { useBuilderStore } from "@/stores/use-builder-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FormFieldDef, LogicOperator } from "@/types/form";
import { generateFieldId } from "@/lib/slug";

const OPERATORS: { value: LogicOperator; label: string; needsValue: boolean }[] = [
  { value: "equals", label: "equals", needsValue: true },
  { value: "not_equals", label: "does not equal", needsValue: true },
  { value: "contains", label: "contains", needsValue: true },
  { value: "not_contains", label: "does not contain", needsValue: true },
  { value: "is_empty", label: "is empty", needsValue: false },
  { value: "is_not_empty", label: "is not empty", needsValue: false },
  { value: "greater_than", label: "is greater than", needsValue: true },
  { value: "less_than", label: "is less than", needsValue: true },
];

export function LogicEditor({ field }: { field: FormFieldDef }) {
  const fields = useBuilderStore((s) => s.fields);
  const updateField = useBuilderStore((s) => s.updateField);
  const settings = useBuilderStore((s) => s.settings);

  const otherFields = fields.filter(
    (f) =>
      f.id !== field.id &&
      f.type !== "section_heading" &&
      f.type !== "page_break",
  );

  const addRule = () => {
    updateField(field.id, {
      logic: [
        ...field.logic,
        {
          id: generateFieldId(),
          sourceFieldId: otherFields[0]?.id ?? "",
          operator: "equals",
          value: "",
          action: "show",
        },
      ],
    });
  };

  const updateRule = (id: string, patch: Partial<(typeof field.logic)[number]>) => {
    updateField(field.id, {
      logic: field.logic.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  };

  const removeRule = (id: string) => {
    updateField(field.id, {
      logic: field.logic.filter((r) => r.id !== id),
    });
  };

  if (otherFields.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Add another input field first to configure logic.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Show, hide, or jump to a step based on previous answers.
      </p>
      {field.logic.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          No rules yet.
        </div>
      )}
      {field.logic.map((rule) => {
        const op = OPERATORS.find((o) => o.value === rule.operator);
        return (
          <div
            key={rule.id}
            className="space-y-2 rounded-lg border border-border/60 bg-background p-3"
          >
            <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <span>If</span>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => removeRule(rule.id)}
                aria-label="Remove rule"
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Select
              value={rule.sourceFieldId}
              onValueChange={(v) => updateRule(rule.id, { sourceFieldId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose field" />
              </SelectTrigger>
              <SelectContent>
                {otherFields.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label || "Untitled"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={rule.operator}
              onValueChange={(v) =>
                updateRule(rule.id, { operator: v as LogicOperator })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {op?.needsValue && (
              <Input
                placeholder="Value"
                value={String(rule.value ?? "")}
                onChange={(e) => updateRule(rule.id, { value: e.target.value })}
              />
            )}
            <Label className="block pt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Then
            </Label>
            <Select
              value={rule.action}
              onValueChange={(v) =>
                updateRule(rule.id, {
                  action: v as "show" | "hide" | "go_to_step" | "end_form",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="show">show this field</SelectItem>
                <SelectItem value="hide">hide this field</SelectItem>
                {settings.multiStep && (
                  <SelectItem value="go_to_step">go to step</SelectItem>
                )}
                <SelectItem value="end_form">end the form</SelectItem>
              </SelectContent>
            </Select>
            {rule.action === "go_to_step" && (
              <Input
                type="number"
                min={1}
                value={rule.targetStep ?? ""}
                onChange={(e) =>
                  updateRule(rule.id, {
                    targetStep: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
                placeholder="Target step number"
              />
            )}
          </div>
        );
      })}
      <Button
        size="sm"
        variant="ghost"
        onClick={addRule}
        className="w-full justify-start text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        Add rule
      </Button>
    </div>
  );
}
