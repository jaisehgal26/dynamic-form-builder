"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/components/theme/theme-provider";

export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <SonnerToaster
      position="bottom-right"
      theme={resolvedTheme}
      closeButton={false}
      offset={20}
      toastOptions={{
        duration: 3500,
        className: "!font-sans",
        classNames: {
          toast:
            "group toast !rounded-lg !border !border-border !bg-popover !text-foreground !shadow-md",
          title: "!text-sm !font-medium",
          description: "!text-xs !text-muted-foreground",
          actionButton:
            "!bg-primary !text-primary-foreground !rounded-md !text-xs",
        },
      }}
    />
  );
}
