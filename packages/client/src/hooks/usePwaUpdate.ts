import { useCallback, useEffect, useRef, useState } from "react";

import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * localStorage keys for the last successful update check and the last time a new service worker
 * actually took control of this device. The service worker is registered per-browser/per-device,
 * so both are inherently device-local facts — they live in localStorage, not the server-side
 * `app_settings` singleton (which is for prefs that should sync across devices).
 */
const LAST_CHECKED_KEY = "pwa:last-update-check";
const LAST_UPDATED_KEY = "pwa:last-update-applied";

function readTimestamp(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }
  catch {
    // Storage unavailable (private mode / disabled) — treat as never recorded.
    return null;
  }
}

function writeTimestamp(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  }
  catch {
    // Storage unavailable — the in-memory state still reflects the event.
  }
}

export interface PwaUpdateState {
  /** True once a new service worker is waiting; the app can be reloaded to apply it. */
  updateAvailable: boolean;
  /** True while a manual update check is in flight. */
  checking: boolean;
  /** Epoch ms of the last completed update check on this device, or null if never checked. */
  lastChecked: number | null;
  /** Epoch ms of the last time a new service worker took control on this device, or null if never updated. */
  lastUpdated: number | null;
  /** Poll the server for a new service worker and record the check time. */
  checkForUpdate: () => Promise<void>;
  /** Activate the waiting service worker and reload the page with the latest version. */
  applyUpdate: () => void;
}

/**
 * Wraps vite-plugin-pwa's `useRegisterSW` to expose a manual "check for updates now" action, the
 * "an update is waiting" flag, and persisted "last checked" / "last updated" timestamps — the data
 * the Settings UI needs to let the user force-update the installed PWA. Registration itself is
 * still handled by the virtual module (so this doesn't change the existing autoUpdate behavior);
 * we only capture the registration to drive an on-demand `update()` poll. "Last updated" is
 * recorded via the `controllerchange` event, which fires whenever a new service worker actually
 * takes control — whether triggered by the manual `applyUpdate()` button or by the plugin's own
 * autoUpdate behavior — so it reflects the app version actually running, not just the last poll.
 */
export function usePwaUpdate(): PwaUpdateState {
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<number | null>(() => readTimestamp(LAST_CHECKED_KEY));
  const [lastUpdated, setLastUpdated] = useState<number | null>(() => readTimestamp(LAST_UPDATED_KEY));

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swScriptUrl, registration) {
      registrationRef.current = registration;
    },
  });

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onControllerChange = (): void => {
      const now = Date.now();
      writeTimestamp(LAST_UPDATED_KEY, now);
      setLastUpdated(now);
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  const checkForUpdate = useCallback(async () => {
    setChecking(true);
    try {
      await registrationRef.current?.update();
    }
    finally {
      const now = Date.now();
      writeTimestamp(LAST_CHECKED_KEY, now);
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
    lastUpdated,
    checkForUpdate,
    applyUpdate,
  };
}
