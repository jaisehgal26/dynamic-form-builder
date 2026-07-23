"use client";

import * as React from "react";
import { Plus, Sliders, Trash2 } from "lucide-react";
import { useBuilderStore } from "@/stores/use-builder-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CHOICE_FIELD_TYPES, type FieldType, FIELD_TYPE_LABELS } from "@/types/form";
import { generateFieldId } from "@/lib/slug";
import { LogicEditor } from "./logic-editor";
import { FieldIcon } from "./field-icons";
import { EmptyState } from "@/components/ui/empty-state";

export function FieldEditorPanel() {
  const fields = useBuilderStore((s) => s.fields);
  const selectedFieldId = useBuilderStore((s) => s.selectedFieldId);
  const updateField = useBuilderStore((s) => s.updateField);
  const settings = useBuilderStore((s) => s.settings);

  const field = fields.find((f) => f.id === selectedFieldId);

  if (!field) {
    return (
      <div className="flex h-full items-center justify-center p-2">
        <EmptyState
          icon={<Sliders className="h-4 w-4" />}
          title="No field selected"
          description="Click any field on the canvas to edit its label, validation, and conditional logic."
        />
      </div>
    );
  }

  const isInput =
    field.type !== "section_heading" && field.type !== "page_break";
  const isChoice = (CHOICE_FIELD_TYPES as FieldType[]).includes(field.type);
  const maxStep = Math.max(1, ...fields.map((f) => f.step));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground/70">
          <FieldIcon type={field.type} className="h-3 w-3" />
          {FIELD_TYPE_LABELS[field.type]}
        </div>
        <div className="mt-1 truncate text-sm font-medium tracking-tightish">
          {field.label || "Untitled question"}
        </div>
      </div>
      <Tabs defaultValue="general" className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border/60 px-3 pt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="validation" disabled={!isInput}>
              Rules
            </TabsTrigger>
            <TabsTrigger value="logic">Logic</TabsTrigger>
          </TabsList>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
          <TabsContent value="general" className="mt-0 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="field-label">Label</Label>
              <Textarea
                id="field-label"
                rows={2}
                value={field.label}
                onChange={(e) =>
                  updateField(field.id, { label: e.target.value })
                }
              />
            </div>
            {isInput && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="field-desc">Description</Label>
                  <Textarea
                    id="field-desc"
                    rows={2}
                    value={field.description ?? ""}
                    onChange={(e) =>
                      updateField(field.id, { description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="field-placeholder">Placeholder</Label>
                  <Input
                    id="field-placeholder"
                    value={field.placeholder ?? ""}
                    onChange={(e) =>
                      updateField(field.id, { placeholder: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3.5 py-2.5">
                  <div>
                    <Label
                      htmlFor="field-required"
                      className="text-sm font-medium"
                    >
                      Required
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Respondents must answer.
                    </p>
                  </div>
                  <Switch
                    id="field-required"
                    checked={field.required}
                    onCheckedChange={(checked) =>
                      updateField(field.id, { required: !!checked })
                    }
                  />
                </div>
              </>
            )}

            {settings.multiStep && (
              <div className="space-y-1.5">
                <Label>Step</Label>
                <Select
                  value={String(field.step)}
                  onValueChange={(v) =>
                    updateField(field.id, { step: Number(v) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: maxStep + 1 }).map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        Step {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isChoice && (
              <ChoiceOptionsEditor
                fieldId={field.id}
                options={field.config.options ?? []}
              />
            )}

            {field.type === "rating" && (
              <div className="space-y-1.5">
                <Label>Max rating</Label>
                <Select
                  value={String(field.config.maxRating ?? 5)}
                  onValueChange={(v) =>
                    updateField(field.id, {
                      config: {
                        ...field.config,
                        maxRating: Number(v),
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 7, 10].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} stars
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {field.type === "section_heading" && (
              <div className="space-y-1.5">
                <Label>Heading level</Label>
                <Select
                  value={field.config.headingLevel ?? "h2"}
                  onValueChange={(v) =>
                    updateField(field.id, {
                      config: {
                        ...field.config,
                        headingLevel: v as "h1" | "h2" | "h3",
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="h1">H1</SelectItem>
                    <SelectItem value="h2">H2</SelectItem>
                    <SelectItem value="h3">H3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          <TabsContent value="validation" className="mt-0 space-y-4">
            {(field.type === "short_text" ||
              field.type === "long_text" ||
              field.type === "email" ||
              field.type === "phone") && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Min length</Label>
                    <Input
                      type="number"
                      min={0}
                      value={field.validation.minLength ?? ""}
                      onChange={(e) =>
                        updateField(field.id, {
                          validation: {
                            ...field.validation,
                            minLength: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Max length</Label>
                    <Input
                      type="number"
                      min={1}
                      value={field.validation.maxLength ?? ""}
                      onChange={(e) =>
                        updateField(field.id, {
                          validation: {
                            ...field.validation,
                            maxLength: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Regex pattern</Label>
                  <Input
                    placeholder="^[A-Z]+$"
                    value={field.validation.pattern ?? ""}
                    onChange={(e) =>
                      updateField(field.id, {
                        validation: {
                          ...field.validation,
                          pattern: e.target.value || undefined,
                        },
                      })
                    }
                    className="font-mono text-xs"
                  />
                </div>
              </>
            )}
            {field.type === "number" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Min</Label>
                  <Input
                    type="number"
                    value={field.validation.min ?? ""}
                    onChange={(e) =>
                      updateField(field.id, {
                        validation: {
                          ...field.validation,
                          min: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Max</Label>
                  <Input
                    type="number"
                    value={field.validation.max ?? ""}
                    onChange={(e) =>
                      updateField(field.id, {
                        validation: {
                          ...field.validation,
                          max: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Custom error message</Label>
              <Input
                placeholder="Please answer this correctly"
                value={field.validation.customMessage ?? ""}
                onChange={(e) =>
                  updateField(field.id, {
                    validation: {
                      ...field.validation,
                      customMessage: e.target.value || undefined,
                    },
                  })
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="logic" className="mt-0">
            <LogicEditor field={field} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function ChoiceOptionsEditor({
  fieldId,
  options,
}: {
  fieldId: string;
  options: { id: string; label: string; value: string }[];
}) {
  const updateField = useBuilderStore((s) => s.updateField);
  const fields = useBuilderStore((s) => s.fields);
  const field = fields.find((f) => f.id === fieldId);
  if (!field) return null;

  const update = (
    next: { id: string; label: string; value: string }[],
  ) => {
    updateField(fieldId, {
      config: { ...field.config, options: next },
    });
  };

  return (
    <div className="space-y-2">
      <Label>Options</Label>
      <div className="space-y-1.5">
        {options.map((opt, idx) => (
          <div key={opt.id} className="flex items-center gap-1.5">
            <Input
              value={opt.label}
              className="h-9"
              onChange={(e) => {
                const next = [...options];
                next[idx] = {
                  ...next[idx],
                  label: e.target.value,
                  value: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "_")
                    .replace(/^_|_$/g, "")
                    .slice(0, 64) || `option_${idx + 1}`,
                };
                update(next);
              }}
            />
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => update(options.filter((_, i) => i !== idx))}
              aria-label="Remove option"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="w-full justify-start text-muted-foreground hover:text-foreground"
        onClick={() =>
          update([
            ...options,
            {
              id: generateFieldId(),
              label: `Option ${options.length + 1}`,
              value: `option_${options.length + 1}`,
            },
          ])
        }
      >
        <Plus className="h-3.5 w-3.5" />
        Add option
      </Button>
    </div>
  );
}
