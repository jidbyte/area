import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: string; direction: "up" | "down" };
}) {
  return (
    <Card className="border-border bg-linear-to-br from-surface to-accent/30 shadow-sm">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-solid">
          <p className="text-xs font-semibold tracking-wide uppercase text-wrap">
            {label}
          </p>

          {Icon && (
            <div className="flex size-8 items-center justify-center rounded-md bg-muted/80 text-ink">
              <Icon className="size-4 lg:size-6 text-solid" />
            </div>
          )}
        </div>

        <p className="text-xl lg:text-3xl font-bold tracking-tight text-ink">
          {value}
        </p>

        {(hint || trend) && (
          <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs">
            <span className="text-neutral">{hint}</span>
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
                  trend.direction === "up"
                    ? "bg-success/10 text-success"
                    : "bg-danger/10 text-danger",
                )}
              >
                {trend.direction === "up" ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {trend.value}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
