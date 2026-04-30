import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FormNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold">Form not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This form doesn't exist or you don't have access to it.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
