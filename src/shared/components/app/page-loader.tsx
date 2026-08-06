"use client";

import { Loader2 } from "lucide-react";

import { usePageLoaderStore } from "@/shared/stores/page-loader-store";

/**
 * Mounted once in Providers. Any action anywhere in the app can trigger
 * this via usePageLoaderStore (or the useActionTransition hook, which
 * wires it up automatically) — a dark overlay with a centered spinner over
 * the whole screen while a create/update/delete/etc. request is in flight.
 */
export function PageLoader() {
  const count = usePageLoaderStore((s) => s.count);
  const message = usePageLoaderStore((s) => s.message);

  if (count === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-black/50 backdrop-blur-[1px]"
    >
      <Loader2 className="size-10 animate-spin text-white" />
      {message && <p className="text-sm font-medium text-white">{message}</p>}
    </div>
  );
}
