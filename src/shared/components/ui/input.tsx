import * as React from "react";
import { cn } from "@/shared/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconClassName?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", icon: Icon, iconClassName, ...props }, ref) => {
    const hasIcon = !!Icon;

    return (
      <div className="relative w-full">
        {hasIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
            <Icon className={cn("mt-0.5 size-4 text-neutral", iconClassName)} />
          </div>
        )}

        <input
          ref={ref}
          type={type}
          data-slot="input"
          className={cn(
            "flex h-9 w-full rounded-md border border-neutral bg-muted/50 py-2 px-4 text-sm tracking-wide text-ink transition-all outline-none",
            "focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-info focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-neutral",
            "aria-invalid:border-transparent aria-invalid:ring-1 aria-invalid:ring-danger",
            hasIcon && "pl-8",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
