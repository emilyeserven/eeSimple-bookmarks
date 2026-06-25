import { useCallback, useRef, useState } from "react";

import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * localStorage key for the last successful update check. The service worker is registered
 * per-browser/per-device, so "when did this device last check for a new app version" is an
 * inherently device-local fact — it lives in localStorage, not the server-side `app_settings`
 * singleton (which is for prefs that should sync across devices).
 */
const LAST_CHECKED_KEY = "pwa:last-update-check";

function readLastChecked(): number | null {
  try {
    const raw = localStorage.getItem(LAST_CHECKED_KEY);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }
  catch {
    // Storage unavailable (private mode / disabled) — treat as never checked.
    return null;
  }
}

function writeLastChecked(value: number): void {
  try {
    localStorage.setItem(LAST_CHECKED_KEY, String(value));
  }
  catch {
    // Storage unavailable — the in-memory state still reflects the check.
  }
}

export interface PwaUpdateState {
  /** True once a new service worker is waiting; the app can be reloaded to apply it. */
  updateAvailable: boolean;
  /** True while a manual update check is in flight. */
  checking: boolean;
  /** Epoch ms of the last completed update check on this device, or null if never checked. */
  lastChecked: number | null;
  /** Poll the server for a new service worker and record the check time. */
  checkForUpdate: () => Promise<void>;
  /** Activate the waiting service worker and reload the page with the latest version. */
  applyUpdate: () => void;
}

/**
 * Wraps vite-plugin-pwa's `useRegisterSW` to expose a manual "check for updates now" action, the
 * "an update is waiting" flag, and a persisted "last checked" timestamp — the data the Settings UI
 * needs to let the user force-update the installed PWA. Registration itself is still handled by the
 * virtual module (so this doesn't change the existing autoUpdate behavior); we only capture the
 * registration to drive an on-demand `update()` poll.
 */
export function usePwaUpdate(): PwaUpdateState {
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<number | null>(() => readLastChecked());

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swScriptUrl, registration) {
      registrationRef.current = registration;
    },
  });

  const checkForUpdate = useCallback(async () => {
    setChecking(true);
    try {
      await registrationRef.current?.update();
    }
    finally {
      const now = Date.now();
      writeLastChecked(now);
      setLastChecked(now);
      setChecking(false);
    }
  }, []);

  const applyUpdate = useCallback(() => {
    void updateServiceWorker(true);
  }, [updateServiceWorker]);

  return {
    updateAvailable: needRefresh,
    checking,
    lastChecked,
    checkForUpdate,
    applyUpdate,
  };
}
