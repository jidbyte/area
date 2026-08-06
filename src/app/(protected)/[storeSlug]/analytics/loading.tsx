import { PageHeaderSkeleton, StatCardsSkeleton } from "@/shared/components/common/loading-skeletons";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-4">
      <PageHeaderSkeleton />
      <Skeleton className="h-10 w-full max-w-md rounded-md" />
      <StatCardsSkeleton count={4} />
      <Skeleton className="h-72 rounded-lg" />
    </div>
  );
}
