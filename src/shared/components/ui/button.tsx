import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium cursor-pointer hover:scale-105 transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-danger/20 aria-invalid:border-danger",
  {
    variants: {
      variant: {
        default: "bg-primary text-surface shadow-xs hover:bg-primary/90",
        primary: "bg-secondary text-ink shadow-xs hover:bg-secondary/80",
        secondary: "bg-solid text-surface shadow-xs hover:bg-solid/80",
        ghost:
          "bg-muted hover:bg-neutral/20 hover:text-ink hover:border hover:border-neutral/50",
        link: "text-primary underline-offset-4 hover:underline",
        destructive:
          "bg-danger text-white shadow-xs hover:bg-danger/90 focus-visible:ring-danger/20",
        outline:
          "border border-neutral bg-surface text-ink shadow-xs hover:bg-muted hover:border-ink",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-7 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
      shape: {
        square: "rounded-none",
        circle: "rounded-full",
        round: "rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "circle",
    },
  },
);

function Button({
  className,
  variant,
  size,
  shape,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, shape, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
