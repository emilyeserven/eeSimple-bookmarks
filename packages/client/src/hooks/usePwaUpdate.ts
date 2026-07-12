import type { UpdateCheckOutcome } from "../lib/pwa";

import { useCallback, useEffect, useState } from "react";

import {
  applyPwaUpdate,
  getPwaRegistration,
  LAST_CHECKED_KEY,
  LAST_UPDATED_KEY,
  readTimestamp,
  runUpdateCheck,
  writeTimestamp,
} from "../lib/pwa";

export type { UpdateCheckOutcome };

export interface PwaUpdateState {
  /** True when a new service worker is waiting; the app can be reloaded to apply it. */
  updateAvailable: boolean;
  /** True while a manual update check is in flight. */
  checking: boolean;
  /** Epoch ms of the last completed update check on this device, or null if never checked. */
  lastChecked: number | null;
  /** Epoch ms of the last time a new service worker took control on this device, or null if never updated. */
  lastUpdated: number | null;
  /** Poll the server for a new service worker, record the check time, and report the outcome. */
  checkForUpdate: () => Promise<UpdateCheckOutcome>;
  /** Activate the waiting service worker and reload the page with the latest version. */
  applyUpdate: () => void;
}

/**
 * Exposes the Settings UI's manual "check for updates now" action and the persisted
 * "last checked" / "last updated" timestamps. Registration itself is app-wide and lives in
 * `lib/pwa.ts` (initialized once from `main.tsx`); this hook only *reads* that shared registration
 * so it never registers a second, page-scoped worker (which was the bug that kept the autoUpdate
 * lifecycle from running anywhere but this page). "Last updated" reflects the `controllerchange`
 * event, which fires whenever a new service worker takes control — via the manual button or the
 * plugin's own autoUpdate reload — so it tracks the version actually running, not just the last poll.
 */
export function usePwaUpdate(): PwaUpdateState {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [lastChecked, setLastChecked] = useState<number | null>(() => readTimestamp(LAST_CHECKED_KEY));
  const [lastUpdated, setLastUpdated] = useState<number | null>(() => readTimestamp(LAST_UPDATED_KEY));

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onControllerChange = (): void => {
      setLastUpdated(readTimestamp(LAST_UPDATED_KEY) ?? Date.now());
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  const checkForUpdate = useCallback(async (): Promise<UpdateCheckOutcome> => {
    setChecking(true);
    try {
      const outcome = await runUpdateCheck();
      // A lingering waiting worker (rare under autoUpdate's skipWaiting) is what "Update now" applies.
      setUpdateAvailable(Boolean(getPwaRegistration()?.waiting));
      return outcome;
    }
    finally {
      const now = Date.now();
      writeTimestamp(LAST_CHECKED_KEY, now);
      setLastChecked(now);
      setChecking(false);
    }
  }, []);

  const applyUpdate = useCallback(() => {
    void applyPwaUpdate();
  }, []);

  return {
    updateAvailable,
    checking,
    lastChecked,
    lastUpdated,
    checkForUpdate,
    applyUpdate,
  };
}
