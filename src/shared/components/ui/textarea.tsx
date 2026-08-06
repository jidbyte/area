import * as React from "react"

import { cn } from "@/shared/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex h-24 w-full rounded-md border border-neutral bg-muted/50 py-2 px-4 text-sm tracking-wide text-ink transition-all ",
        "focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-info outline-none focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-60 placeholder:text-neutral resize-none",
        "aria-invalid:border-transparent aria-invalid:ring-1 aria-invalid:ring-danger",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea }
