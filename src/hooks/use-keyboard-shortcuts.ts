"use client";

import * as React from "react";

export type ShortcutHandler = (e: KeyboardEvent) => void;

export interface ShortcutDefinition {
  /** Plain key name (e.g., "z", "s", "Backspace", "Escape", "Delete") */
  key: string;
  /** Cmd on Mac / Ctrl on Windows. */
  meta?: boolean;
  shift?: boolean;
  /** Run the shortcut even when focus is inside an input/textarea. */
  allowInInput?: boolean;
  handler: ShortcutHandler;
}

function isEditable(target: EventTarget | null): boolean {
  if (!target) return false;
  const el = target as HTMLElement;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts(shortcuts: ShortcutDefinition[]) {
  const ref = React.useRef(shortcuts);
  ref.current = shortcuts;

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac =
        typeof navigator !== "undefined" && /mac/i.test(navigator.platform);
      for (const s of ref.current) {
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();
        if (!keyMatch) continue;
        const metaPressed = isMac ? e.metaKey : e.ctrlKey;
        if (!!s.meta !== metaPressed) continue;
        if (!!s.shift !== e.shiftKey) continue;
        if (isEditable(e.target) && !s.allowInInput) continue;
        e.preventDefault();
        s.handler(e);
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
