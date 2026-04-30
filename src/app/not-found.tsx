import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/">Back to FormForge</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
