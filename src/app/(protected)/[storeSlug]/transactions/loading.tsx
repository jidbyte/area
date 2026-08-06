import { CardGridSkeleton } from "@/shared/components/common/loading-skeletons";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function TransactionsLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <CardGridSkeleton count={6} />
    </div>
  );
}
