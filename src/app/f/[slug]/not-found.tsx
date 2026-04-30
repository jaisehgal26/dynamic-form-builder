import Link from "next/link";
import { FileSearch } from "lucide-react";

export default function NotFound() {
  return (
    <div className="light-scope flex min-h-screen items-center justify-center bg-muted/20 px-4 text-foreground">
      <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <FileSearch className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold">Form not found</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This form is not published, has been deleted, or never existed.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          Back to FormForge
        </Link>
      </div>
    </div>
  );
}
