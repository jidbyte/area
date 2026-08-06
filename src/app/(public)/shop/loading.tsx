import { Skeleton } from "@/shared/components/ui/skeleton";

function ProductGridSkeleton() {
  return (
    <div className="py-8">
      <Skeleton className="mb-4 h-6 w-32" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-6xl p-4 md:px-12">
      <div className="flex items-center justify-between py-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="size-8 rounded-full" />
      </div>
      <Skeleton className="h-16 w-full rounded-md" />
      <ProductGridSkeleton />
      <ProductGridSkeleton />
    </div>
  );
}
