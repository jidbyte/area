import { Skeleton } from "@/shared/components/ui/skeleton";

export default function StoreLoading() {
  return (
    <div>
      <div className="flex items-center gap-8 border-b p-4 md:px-12">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="ml-auto size-9 rounded-full" />
      </div>
      <div className="mx-auto p-4 md:px-12">
        <Skeleton className="my-6 h-64 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3 py-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
