import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleCheck, CircleAlert, TriangleAlert, Info } from "lucide-react";

import { cn } from "@/shared/lib/utils";

const messageVariants = cva(
  "flex items-start gap-2 font-medium rounded-md border p-2 text-sm shadow-xs",
  {
    variants: {
      variant: {
        success: "bg-success/10 border-success/30 text-success",
        error: "bg-danger/10 border-danger/30 text-danger mb-2.5",
        invalid: "border-none p-0 text-danger mt-1 gap-1 text-sm",
        warning: "bg-warning/10 border-warning/30 text-warning",
        info: "bg-info/10 border-info/30 text-info",
      },
    },
    defaultVariants: {
      variant: "invalid",
    },
  },
);

const ICON_MAP = {
  success: CircleCheck,
  error: CircleAlert,
  invalid: CircleAlert,
  warning: TriangleAlert,
  info: Info,
} as const;

export function Message({
  variant = "invalid",
  className,
  children,
}: {
  variant?: VariantProps<typeof messageVariants>["variant"];
  className?: string;
  children: ReactNode;
}) {
  const Icon = ICON_MAP[variant ?? "invalid"];

  return (
    <div className={cn(messageVariants({ variant }), className)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
