"use client";

import { create } from "zustand";
import type {
  FieldType,
  FormFieldDef,
  FormSettings,
  FormTheme,
} from "@/types/form";
import { DEFAULT_SETTINGS, DEFAULT_THEME } from "@/types/form";
import { createDefaultField } from "@/lib/form-helpers";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface BuilderState {
  formId: string | null;
  title: string;
  description: string;
  status: "draft" | "published" | "archived";
  slug: string;
  fields: FormFieldDef[];
  settings: FormSettings;
  theme: FormTheme;
  selectedFieldId: string | null;
  isDirty: boolean;
  autosaveStatus: AutosaveStatus;
  lastSavedAt: number | null;

  init: (data: {
    formId: string;
    title: string;
    description: string;
    status: "draft" | "published" | "archived";
    slug: string;
    fields: FormFieldDef[];
    settings: FormSettings;
    theme: FormTheme;
  }) => void;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setStatus: (status: "draft" | "published" | "archived") => void;
  selectField: (fieldId: string | null) => void;
  addField: (type: FieldType, step?: number) => string;
  updateField: (fieldId: string, patch: Partial<FormFieldDef>) => void;
  duplicateField: (fieldId: string) => void;
  deleteField: (fieldId: string) => void;
  reorderFields: (orderedIds: string[]) => void;
  updateSettings: (patch: Partial<FormSettings>) => void;
  updateTheme: (patch: Partial<FormTheme>) => void;
  importSchema: (schema: {
    title?: string;
    description?: string;
    settings?: FormSettings;
    theme?: FormTheme;
    fields?: FormFieldDef[];
  }) => void;
  setAutosaveStatus: (status: AutosaveStatus, savedAt?: number | null) => void;
  markClean: () => void;
}

function reposition(fields: FormFieldDef[]): FormFieldDef[] {
  return fields.map((f, idx) => ({ ...f, position: idx }));
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  formId: null,
  title: "",
  description: "",
  status: "draft",
  slug: "",
  fields: [],
  settings: DEFAULT_SETTINGS,
  theme: DEFAULT_THEME,
  selectedFieldId: null,
  isDirty: false,
  autosaveStatus: "idle",
  lastSavedAt: null,

  init: (data) =>
    set({
      formId: data.formId,
      title: data.title,
      description: data.description ?? "",
      status: data.status,
      slug: data.slug,
      fields: reposition(
        [...data.fields].sort(
          (a, b) => a.step - b.step || a.position - b.position,
        ),
      ),
      settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
      theme: { ...DEFAULT_THEME, ...(data.theme ?? {}) },
      selectedFieldId: null,
      isDirty: false,
      autosaveStatus: "idle",
      lastSavedAt: null,
    }),

  setTitle: (title) => set({ title, isDirty: true }),
  setDescription: (description) => set({ description, isDirty: true }),
  setStatus: (status) => set({ status }),

  selectField: (fieldId) => set({ selectedFieldId: fieldId }),

  addField: (type, step) => {
    const state = get();
    const targetStep = step ?? Math.max(1, ...state.fields.map((f) => f.step));
    const newField = createDefaultField(
      type,
      state.fields.length,
      targetStep,
    );
    set({
      fields: reposition([...state.fields, newField]),
      selectedFieldId: newField.id,
      isDirty: true,
    });
    return newField.id;
  },

  updateField: (fieldId, patch) =>
    set((state) => ({
      fields: state.fields.map((f) =>
        f.id === fieldId ? { ...f, ...patch } : f,
      ),
      isDirty: true,
    })),

  duplicateField: (fieldId) => {
    const state = get();
    const idx = state.fields.findIndex((f) => f.id === fieldId);
    if (idx === -1) return;
    const original = state.fields[idx];
    const copy: FormFieldDef = {
      ...original,
      id: `${original.id}_copy_${Date.now().toString(36)}`,
      label: `${original.label} (Copy)`,
    };
    const next = [...state.fields];
    next.splice(idx + 1, 0, copy);
    set({
      fields: reposition(next),
      selectedFieldId: copy.id,
      isDirty: true,
    });
  },

  deleteField: (fieldId) =>
    set((state) => {
      const next = state.fields.filter((f) => f.id !== fieldId);
      return {
        fields: reposition(next),
        selectedFieldId:
          state.selectedFieldId === fieldId ? null : state.selectedFieldId,
        isDirty: true,
      };
    }),

  reorderFields: (orderedIds) =>
    set((state) => {
      const map = new Map(state.fields.map((f) => [f.id, f]));
      const next = orderedIds
        .map((id) => map.get(id))
        .filter((f): f is FormFieldDef => !!f);
      const remaining = state.fields.filter((f) => !orderedIds.includes(f.id));
      return {
        fields: reposition([...next, ...remaining]),
        isDirty: true,
      };
    }),

  updateSettings: (patch) =>
    set((state) => ({
      settings: { ...state.settings, ...patch },
      isDirty: true,
    })),

  updateTheme: (patch) =>
    set((state) => ({
      theme: { ...state.theme, ...patch },
      isDirty: true,
    })),

  importSchema: (schema) =>
    set((state) => ({
      title: schema.title ?? state.title,
      description: schema.description ?? state.description,
      settings: schema.settings
        ? { ...DEFAULT_SETTINGS, ...schema.settings }
        : state.settings,
      theme: schema.theme ? { ...DEFAULT_THEME, ...schema.theme } : state.theme,
      fields: schema.fields
        ? reposition(
            [...schema.fields].sort(
              (a, b) => a.step - b.step || a.position - b.position,
            ),
          )
        : state.fields,
      isDirty: true,
    })),

  setAutosaveStatus: (status, savedAt) =>
    set((state) => ({
      autosaveStatus: status,
      lastSavedAt:
        status === "saved" ? savedAt ?? Date.now() : state.lastSavedAt,
    })),

  markClean: () => set({ isDirty: false }),
}));
