import { StorefrontGridSkeleton } from "@/shared/components/common/loading-skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl p-4 md:px-12">
      <StorefrontGridSkeleton />
    </div>
  );
}
