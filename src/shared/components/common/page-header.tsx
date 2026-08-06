import { type ComponentType, type ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export function PageHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-accent p-4 md:p-6 my-2 md:my-4 rounded-md", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {children}
      </div>
    </div>
  );
}

export function PageTitle({
  children,
  icon: Icon,
  className,
}: {
  children: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "flex items-center gap-2 text-lg md:text-2xl font-semibold text-ink tracking-tight",
        className,
      )}
    >
      {Icon && <Icon className="size-5 md:size-6 shrink-0" />}
      <span>{children}</span>
    </h1>
  );
}

export function PageAction({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {children}
    </div>
  );
}
