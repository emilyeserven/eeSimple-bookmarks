import type { SyncDiffGroup, SyncProvider, SyncSourceFetch } from "./syncSourceTypes";

/**
 * Shared plumbing for a `descriptorKind` fetch hook (`useBookmarkSyncSource` /
 * `useLocationSyncSource` / `useImageOnlyTaxonomySyncSource`): each hook still runs its own
 * `useQuery` calls (the count and gating refs differ per kind), but describes each one as a
 * {@link SyncQuerySlot} and hands the list to {@link resolveSyncSourceFetch} instead of hand-rolling
 * its own pending/error/group-assembly chain. Pure — no React/query involved — so it's directly
 * unit-tested.
 */

/** Reads a string ref, treating missing/blank/non-string as null. */
export function strRef(refs: SyncProvider["refs"], key: string): string | null {
  const value = refs?.[key];
  return typeof value === "string" && value !== "" ? value : null;
}

/** Reads a number ref, treating missing/non-number as null. */
export function numRef(refs: SyncProvider["refs"], key: string): number | null {
  const value = refs?.[key];
  return typeof value === "number" ? value : null;
}

/**
 * One source's contribution to a combined {@link SyncSourceFetch}. `active` is whether this source
 * is actually in play (its gating ref is present) — an inactive slot's `isPending`/`isError` are
 * ignored, so hooks that always call `useQuery` unconditionally (with `enabled: false`) can just
 * pass the raw query flags through.
 */
export interface SyncQuerySlot<T = unknown> {
  active: boolean;
  isPending: boolean;
  isError: boolean;
  /** The resolved query data, or `undefined` while not yet available/not applicable. */
  data: T | undefined;
  /**
   * Set only for slots whose error should surface to the user. Slots without this silently
   * contribute nothing on error (mirrors e.g. the bookmark hook's Plex/podcast/Kavita/ISBN sources,
   * where only the primary scan's failure is shown).
   */
  errorMessage?: string;
  /** Builds this slot's diff groups once `data` is available. */
  buildGroups?: (data: T) => SyncDiffGroup[];
}

/**
 * The shape {@link resolveSyncSourceFetch} actually needs: `data` widened to `unknown` (any slot's
 * data is fine to hold) and `buildGroups` narrowed to take `never` (a function accepting a narrower
 * parameter is always assignable to one accepting a wider parameter, so a caller's
 * `SyncQuerySlot<SomeConcreteType>` always satisfies this without a cast at the call site) — this
 * lets each hook build a plain array mixing slots of different `T`s without reaching for `any`.
 */
type ResolvableSlot = Omit<SyncQuerySlot, "data" | "buildGroups"> & {
  data: unknown;
  buildGroups?: (data: never) => SyncDiffGroup[];
};

/**
 * Combines every source slot into one {@link SyncSourceFetch}: any active slot still pending wins
 * (loading), else the first active slot with both an error and an `errorMessage` wins (error), else
 * every slot's resolved data is run through its `buildGroups` and concatenated in slot order.
 */
export function resolveSyncSourceFetch(slots: ResolvableSlot[]): SyncSourceFetch {
  const anyPending = slots.some(slot => slot.active && slot.isPending);
  if (anyPending) {
    return {
      diff: null,
      isLoading: true,
      error: null,
    };
  }

  const erroring = slots.find(slot => slot.active && slot.isError && slot.errorMessage);
  if (erroring) {
    return {
      diff: null,
      isLoading: false,
      error: erroring.errorMessage ?? null,
    };
  }

  const groups = slots.flatMap(slot => (slot.data !== undefined && slot.buildGroups ? slot.buildGroups(slot.data as never) : []));
  return {
    diff: {
      groups,
    },
    isLoading: false,
    error: null,
  };
}
