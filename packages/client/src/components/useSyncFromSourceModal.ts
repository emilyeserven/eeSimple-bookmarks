import type { SyncFieldDiff, SyncProvider } from "@/lib/syncSources/syncSourceTypes";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useBookmarkSyncSource } from "@/hooks/useBookmarkSyncSource";
import { useImageOnlyTaxonomySyncSource } from "@/hooks/useImageOnlyTaxonomySyncSource";
import { useLocationSyncSource } from "@/hooks/useLocationSyncSource";

/** Whether two selection sets hold the same keys, so a re-seed that changes nothing can bail out. */
function sameKeys(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every(key => b.has(key));
}

/**
 * State + orchestration for {@link SyncFromSourceModal}. Dispatches to the per-kind fetch hook
 * (each gated so only the active one runs while the modal is open), tracks the per-row checkbox
 * selection (seeded from each row's `defaultChecked`) and the locations re-geocode toggle, and
 * exposes an `apply` that hands the selected rows to `provider.applyStaged`. Kept as a hook so
 * {@link SyncFromSourceModal} stays thin JSX (fallow hook-density).
 */
export function useSyncFromSourceModal(provider: SyncProvider, open: boolean, onDone: () => void) {
  const kind = provider.descriptorKind;
  const bookmark = useBookmarkSyncSource(provider, open && kind === "bookmark");
  const location = useLocationSyncSource(provider, open && kind === "location");
  const image = useImageOnlyTaxonomySyncSource(provider, open && kind === "image-taxonomy");

  // Exhaustive over SyncDescriptorKind — only the gated hook for `kind` actually fetched; the rest
  // are idle. A keyed lookup keeps this a single expression (no nested-ternary cognitive load).
  const active = {
    "bookmark": bookmark,
    "location": location,
    "image-taxonomy": image,
  }[kind];
  const diff = active.diff;

  const allRows = useMemo<SyncFieldDiff[]>(
    () => diff?.groups.flatMap(group => group.rows) ?? [],
    [diff],
  );

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [regeocode, setRegeocode] = useState(false);
  const [applying, setApplying] = useState(false);

  // Seed the selection when a fresh diff arrives or the re-geocode toggle flips: re-geocode on
  // selects everything (the intent is "pull it all fresh, overwriting"), off falls back to each
  // row's fill-empty default. Manual per-row toggles between these events are preserved (they don't
  // change the deps). Closing the modal clears both so a re-open starts clean.
  //
  // The seed is applied through a bail-if-unchanged functional update: `new Set(...)` is a fresh
  // reference every time, so an unconditional `setSelectedKeys` would re-render on every run. This
  // hook's `allRows` dep is only as stable as the source hook's `diff` — keeping the update a no-op
  // when the selection is already correct is what stops a churning source from spinning the render
  // loop into React's "Maximum update depth exceeded" (see `useStableSyncSourceFetch`).
  useEffect(() => {
    const next = open
      ? (regeocode
        ? new Set(allRows.map(row => row.key))
        : new Set(allRows.filter(row => row.defaultChecked).map(row => row.key)))
      : new Set<string>();
    setSelectedKeys(current => (sameKeys(current, next) ? current : next));
    if (!open) setRegeocode(false);
  }, [open, allRows, regeocode]);

  const toggle = useCallback((key: string, checked: boolean) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const apply = useCallback(async () => {
    const selected = allRows.filter(row => selectedKeys.has(row.key));
    setApplying(true);
    try {
      await provider.applyStaged(selected, {
        regeocode,
      });
      onDone();
    }
    finally {
      setApplying(false);
    }
  }, [allRows, selectedKeys, provider, regeocode, onDone]);

  return {
    diff,
    isLoading: active.isLoading,
    error: active.error,
    selectedKeys,
    toggle,
    regeocode,
    setRegeocode,
    apply,
    applying,
    selectedCount: selectedKeys.size,
  };
}
