import { CardGridSkeleton, PageHeaderSkeleton } from "@/shared/components/common/loading-skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl p-4 md:px-12 py-10 space-y-4">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={4} />
    </div>
  );
}
