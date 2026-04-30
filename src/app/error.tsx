"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We hit an unexpected error. Try again or come back in a moment.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go home
          </Button>
          <Button onClick={() => reset()}>Try again</Button>
        </div>
      </div>
    </div>
  );
}
