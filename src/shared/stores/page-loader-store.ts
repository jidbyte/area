import { create } from "zustand";

type PageLoaderState = {
  /** Counts overlapping requests rather than a single boolean, so two
   * actions started close together don't have the first one's completion
   * hide the overlay while the second is still in flight. */
  count: number;
  message: string | null;
  show: (message?: string) => void;
  hide: () => void;
};

export const usePageLoaderStore = create<PageLoaderState>((set) => ({
  count: 0,
  message: null,
  show: (message) =>
    set((state) => ({ count: state.count + 1, message: message ?? state.message })),
  hide: () =>
    set((state) => {
      const count = Math.max(0, state.count - 1);
      return { count, message: count === 0 ? null : state.message };
    }),
}));
