import { DetailPageSkeleton } from "@/shared/components/common/loading-skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <DetailPageSkeleton />
    </div>
  );
}
