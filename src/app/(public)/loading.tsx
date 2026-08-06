import { StorefrontGridSkeleton } from "@/shared/components/common/loading-skeletons";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl p-4 md:px-12">
      <Skeleton className="h-64 w-full rounded-xl my-6" />
      <StorefrontGridSkeleton count={5} />
    </div>
  );
}
