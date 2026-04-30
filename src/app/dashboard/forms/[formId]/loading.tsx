import { Skeleton } from "@/components/ui/skeleton";

export default function FormLoading() {
  return (
    <div className="container py-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="mt-6 h-72 w-full" />
    </div>
  );
}
