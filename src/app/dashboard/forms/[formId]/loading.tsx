import { Skeleton } from "@/components/ui/skeleton";

export default function FormLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-6 h-[280px] w-full rounded-xl" />
    </div>
  );
}
