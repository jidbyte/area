import { Skeleton } from "@/shared/components/ui/skeleton";

export default function StoresLoading() {
  return (
    <div className="mx-auto max-w-6xl p-4 md:px-12 py-10">
      <Skeleton className="mb-6 h-9 w-full max-w-sm" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 rounded-md border border-muted/40 p-4">
            <Skeleton className="size-12 shrink-0 rounded-md" />
            <div className="w-full space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
