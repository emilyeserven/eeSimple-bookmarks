import { useEffect } from "react";

import { toast } from "sonner";

/**
 * Stable Sonner id for the "you're offline" toast so the same banner is reused across repeated
 * `offline` events and can be dismissed the moment we come back online (rather than stacking).
 */
const OFFLINE_TOAST_ID = "app-offline";

/** Show the persistent offline banner. Idempotent thanks to the fixed {@link OFFLINE_TOAST_ID}. */
function showOffline(): void {
  toast.warning("You're offline", {
    id: OFFLINE_TOAST_ID,
    description: "Changes can't be saved until your connection comes back.",
    // Connectivity is a sticky state, not a one-off event — keep the banner up until we reconnect.
    duration: Infinity,
  });
}

/** Dismiss the offline banner and confirm reconnection with a brief toast. */
function showOnline(): void {
  toast.dismiss(OFFLINE_TOAST_ID);
  toast.success("Back online", {
    description: "Your connection has been restored.",
  });
}

/**
 * Surface the browser's online/offline state as a toast so it's clear when the app can't reach the
 * server. Listens to the `online`/`offline` window events and shows a sticky "You're offline"
 * banner while disconnected, replaced by a transient "Back online" toast on reconnect. Mount once,
 * globally (see {@link RootLayout}).
 *
 * This is intentionally a raw Sonner toast, not `notifySuccess`/`notifyError`: connectivity is a
 * transient device-local state, not a user action worth keeping in the persistent Notifications log.
 */
export function useOfflineToast(): void {
  useEffect(() => {
    // Cover the case where the app is loaded while already offline — no `offline` event fires then.
    if (!navigator.onLine) showOffline();

    window.addEventListener("offline", showOffline);
    window.addEventListener("online", showOnline);
    return () => {
      window.removeEventListener("offline", showOffline);
      window.removeEventListener("online", showOnline);
    };
  }, []);
}
