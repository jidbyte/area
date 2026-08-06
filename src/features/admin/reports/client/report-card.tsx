import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";

export function ReportCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("bg-accent/20", className)}>
      <CardHeader className="space-y-0.5">
        <CardTitle className="text-base lg:text-lg">{title}</CardTitle>
        {subtitle && <p className="text-xs text-neutral">{subtitle}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function StatRow({
  label,
  value,
  emphasis,
  tone,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  tone?: "success" | "danger" | "neutral";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-1.5",
        emphasis && "border-t border-muted/40 mt-1 pt-2 font-semibold",
      )}
    >
      <span className={emphasis ? "text-ink" : "text-neutral"}>{label}</span>
      <span
        className={cn(
          emphasis ? "text-ink" : "text-ink",
          tone === "success" && "text-success",
          tone === "danger" && "text-danger",
        )}
      >
        {value}
      </span>
    </div>
  );
}
