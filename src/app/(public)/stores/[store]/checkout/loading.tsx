import { FormCardSkeleton } from "@/shared/components/common/loading-skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <FormCardSkeleton />
    </div>
  );
}
