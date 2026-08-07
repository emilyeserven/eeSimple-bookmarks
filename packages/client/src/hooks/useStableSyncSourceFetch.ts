import type { ResolvableSlot } from "../lib/syncSources/syncSourceQuery";
import type { SyncSourceFetch } from "../lib/syncSources/syncSourceTypes";

import { useRef } from "react";

import { resolveSyncSourceFetch, syncSourceFetchesEqual } from "../lib/syncSources/syncSourceQuery";

/**
 * The React seam every `use*SyncSource` hook returns through. `resolveSyncSourceFetch` is pure and
 * rebuilds its `{ diff, isLoading, error }` result — including the whole `diff.groups` tree — on every
 * call, so returning it directly hands consumers a **new object on every render**. That silently
 * defeats any `useMemo`/`useEffect` keyed on it: `useSyncFromSourceModal` memoizes `allRows` on `diff`
 * and re-seeds its checkbox selection whenever `allRows` changes, which turned into an unbounded
 * render loop (React "Maximum update depth exceeded" / minified error #185) on every edit page that
 * registers a `SyncProvider` — the modal's hook runs whenever the provider exists, open or not.
 *
 * So: resolve as before, then hand back the **previous** object while the resolved value is unchanged
 * ({@link syncSourceFetchesEqual}). The identity now changes only when the source data actually does.
 */
export function useStableSyncSourceFetch(slots: ResolvableSlot[]): SyncSourceFetch {
  const resolved = resolveSyncSourceFetch(slots);
  const previous = useRef(resolved);
  if (!syncSourceFetchesEqual(previous.current, resolved)) previous.current = resolved;
  return previous.current;
}
