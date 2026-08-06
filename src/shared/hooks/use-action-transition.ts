"use client";

import { useTransition, useCallback } from "react";

import { usePageLoaderStore } from "@/shared/stores/page-loader-store";

/**
 * Drop-in replacement for React's useTransition, for any form/dialog that
 * calls a server action (create, update, delete, send, etc.). Wraps the
 * callback so the global full-screen PageLoader shows for the duration —
 * `show()`/`hide()` are called around the transition rather than left to
 * each call site to remember.
 *
 * Usage stays almost identical to plain useTransition:
 *   const [isPending, startTransition] = useActionTransition();
 *   startTransition(async () => { ... });
 *   <Button loading={isPending}>Save</Button>
 *
 * Pass a message to show under the spinner: startTransition(fn, "Saving...")
 */
export function useActionTransition(): [
  boolean,
  (callback: () => void | Promise<void>, message?: string) => void,
] {
  const [isPending, start] = useTransition();
  const show = usePageLoaderStore((s) => s.show);
  const hide = usePageLoaderStore((s) => s.hide);

  const startTransition = useCallback(
    (callback: () => void | Promise<void>, message?: string) => {
      show(message);
      start(async () => {
        try {
          await callback();
        } finally {
          hide();
        }
      });
    },
    [show, hide, start],
  );

  return [isPending, startTransition];
}
