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

interface AccessSettings {
  /** A pending plaintext password set by the user; never stored as-is. */
  password: string | null;
  /** When true, the next save should clear the existing password. */
  clearPassword: boolean;
  /** True if the form already has a password configured server-side. */
  hasPassword: boolean;
  expiresAt: number | null;
  responseLimit: number | null;
  collectEmail: boolean;
}

const DEFAULT_ACCESS: AccessSettings = {
  password: null,
  clearPassword: false,
  hasPassword: false,
  expiresAt: null,
  responseLimit: null,
  collectEmail: false,
};

interface Snapshot {
  title: string;
  description: string;
  fields: FormFieldDef[];
  settings: FormSettings;
  theme: FormTheme;
  access: AccessSettings;
}

const HISTORY_LIMIT = 50;

interface BuilderState {
  formId: string | null;
  title: string;
  description: string;
  status: "draft" | "published" | "archived";
  slug: string;
  fields: FormFieldDef[];
  settings: FormSettings;
  theme: FormTheme;
  access: AccessSettings;
  selectedFieldId: string | null;
  isDirty: boolean;
  autosaveStatus: AutosaveStatus;
  lastSavedAt: number | null;

  // History for undo/redo
  past: Snapshot[];
  future: Snapshot[];

  init: (data: {
    formId: string;
    title: string;
    description: string;
    status: "draft" | "published" | "archived";
    slug: string;
    fields: FormFieldDef[];
    settings: FormSettings;
    theme: FormTheme;
    access?: Partial<AccessSettings>;
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
  updateAccess: (patch: Partial<AccessSettings>) => void;
  importSchema: (schema: {
    title?: string;
    description?: string;
    settings?: FormSettings;
    theme?: FormTheme;
    fields?: FormFieldDef[];
  }) => void;
  setAutosaveStatus: (status: AutosaveStatus, savedAt?: number | null) => void;
  markClean: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

function reposition(fields: FormFieldDef[]): FormFieldDef[] {
  return fields.map((f, idx) => ({ ...f, position: idx }));
}

function snapshotOf(state: BuilderState): Snapshot {
  return {
    title: state.title,
    description: state.description,
    fields: state.fields,
    settings: state.settings,
    theme: state.theme,
    access: state.access,
  };
}

/** Produce a partial state update plus a fresh history entry. */
function withHistory(
  state: BuilderState,
  patch: Partial<BuilderState>,
): Partial<BuilderState> {
  const past = [...state.past, snapshotOf(state)];
  if (past.length > HISTORY_LIMIT) past.shift();
  return {
    ...patch,
    past,
    future: [],
    isDirty: true,
  };
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
  access: DEFAULT_ACCESS,
  selectedFieldId: null,
  isDirty: false,
  autosaveStatus: "idle",
  lastSavedAt: null,
  past: [],
  future: [],

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
      access: { ...DEFAULT_ACCESS, ...(data.access ?? {}) },
      selectedFieldId: null,
      isDirty: false,
      autosaveStatus: "idle",
      lastSavedAt: null,
      past: [],
      future: [],
    }),

  setTitle: (title) =>
    set((state) => withHistory(state, { title })),
  setDescription: (description) =>
    set((state) => withHistory(state, { description })),
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
    set(
      withHistory(state, {
        fields: reposition([...state.fields, newField]),
        selectedFieldId: newField.id,
      }),
    );
    return newField.id;
  },

  updateField: (fieldId, patch) =>
    set((state) =>
      withHistory(state, {
        fields: state.fields.map((f) =>
          f.id === fieldId ? { ...f, ...patch } : f,
        ),
      }),
    ),

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
    set(
      withHistory(state, {
        fields: reposition(next),
        selectedFieldId: copy.id,
      }),
    );
  },

  deleteField: (fieldId) =>
    set((state) => {
      const next = state.fields.filter((f) => f.id !== fieldId);
      return withHistory(state, {
        fields: reposition(next),
        selectedFieldId:
          state.selectedFieldId === fieldId ? null : state.selectedFieldId,
      });
    }),

  reorderFields: (orderedIds) =>
    set((state) => {
      const map = new Map(state.fields.map((f) => [f.id, f]));
      const next = orderedIds
        .map((id) => map.get(id))
        .filter((f): f is FormFieldDef => !!f);
      const remaining = state.fields.filter((f) => !orderedIds.includes(f.id));
      return withHistory(state, {
        fields: reposition([...next, ...remaining]),
      });
    }),

  updateSettings: (patch) =>
    set((state) =>
      withHistory(state, {
        settings: { ...state.settings, ...patch },
      }),
    ),

  updateTheme: (patch) =>
    set((state) =>
      withHistory(state, {
        theme: { ...state.theme, ...patch },
      }),
    ),

  updateAccess: (patch) =>
    set((state) =>
      withHistory(state, {
        access: { ...state.access, ...patch },
      }),
    ),

  importSchema: (schema) =>
    set((state) =>
      withHistory(state, {
        title: schema.title ?? state.title,
        description: schema.description ?? state.description,
        settings: schema.settings
          ? { ...DEFAULT_SETTINGS, ...schema.settings }
          : state.settings,
        theme: schema.theme
          ? { ...DEFAULT_THEME, ...schema.theme }
          : state.theme,
        fields: schema.fields
          ? reposition(
              [...schema.fields].sort(
                (a, b) => a.step - b.step || a.position - b.position,
              ),
            )
          : state.fields,
      }),
    ),

  setAutosaveStatus: (status, savedAt) =>
    set((state) => ({
      autosaveStatus: status,
      lastSavedAt:
        status === "saved" ? savedAt ?? Date.now() : state.lastSavedAt,
    })),

  markClean: () => set({ isDirty: false }),

  undo: () => {
    const state = get();
    const last = state.past[state.past.length - 1];
    if (!last) return;
    set({
      past: state.past.slice(0, -1),
      future: [snapshotOf(state), ...state.future],
      title: last.title,
      description: last.description,
      fields: last.fields,
      settings: last.settings,
      theme: last.theme,
      access: last.access,
      isDirty: true,
    });
  },

  redo: () => {
    const state = get();
    const next = state.future[0];
    if (!next) return;
    set({
      past: [...state.past, snapshotOf(state)],
      future: state.future.slice(1),
      title: next.title,
      description: next.description,
      fields: next.fields,
      settings: next.settings,
      theme: next.theme,
      access: next.access,
      isDirty: true,
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
