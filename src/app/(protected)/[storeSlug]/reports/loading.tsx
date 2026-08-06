import { Skeleton } from "@/shared/components/ui/skeleton";
import { Card, CardHeader } from "@/shared/components/ui/card";

export default function ReportsLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-10 w-full max-w-md rounded-md" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-accent/20">
            <CardHeader className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
