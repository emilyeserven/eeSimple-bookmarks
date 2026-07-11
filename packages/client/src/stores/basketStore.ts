import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * The Tab Basket: a persistent, device-local staging list of bookmark ids. A user drops bookmarks
 * into the basket and later opens every basketed link in its own new browser tab (see
 * {@link openBasketTabs}), which makes tab-by-tab batch updates via the browser extension easier.
 *
 * Only ids are stored (order = insertion) — the display url/title are resolved from the cached
 * bookmark list at render time, so a deleted bookmark simply drops out. Persisted to localStorage so
 * the basket survives reloads; it is **only** emptied when the user asks (`clear`).
 */
interface BasketState {
  /** Basketed bookmark ids, in insertion order. */
  bookmarkIds: string[];
  /** Add one bookmark (no-op if already basketed). */
  add: (id: string) => void;
  /** Add many bookmarks at once (deduped), e.g. from the bulk-select bar. */
  addMany: (ids: string[]) => void;
  /** Remove one bookmark from the basket. */
  remove: (id: string) => void;
  /** Toggle one bookmark's membership. */
  toggle: (id: string) => void;
  /** Empty the entire basket (the only thing that clears it). */
  clear: () => void;
}

export const useBasketStore = create<BasketState>()(
  persist(
    set => ({
      bookmarkIds: [],
      add: id => set(state => state.bookmarkIds.includes(id)
        ? state
        : {
          bookmarkIds: [...state.bookmarkIds, id],
        }),
      addMany: ids => set(state => ({
        // Dedupe both against what's already basketed and within the incoming batch.
        bookmarkIds: [...new Set([...state.bookmarkIds, ...ids])],
      })),
      remove: id => set(state => ({
        bookmarkIds: state.bookmarkIds.filter(x => x !== id),
      })),
      toggle: id => set(state => ({
        bookmarkIds: state.bookmarkIds.includes(id)
          ? state.bookmarkIds.filter(x => x !== id)
          : [...state.bookmarkIds, id],
      })),
      clear: () => set({
        bookmarkIds: [],
      }),
    }),
    {
      name: "eesimple-basket",
    },
  ),
);
