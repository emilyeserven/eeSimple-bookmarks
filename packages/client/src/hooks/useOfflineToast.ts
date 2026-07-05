import { useEffect } from "react";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";

/**
 * Stable Sonner id for the "you're offline" toast so the same banner is reused across repeated
 * `offline` events and can be dismissed the moment we come back online (rather than stacking).
 */
const OFFLINE_TOAST_ID = "app-offline";

/** Show the persistent offline banner. Idempotent thanks to the fixed {@link OFFLINE_TOAST_ID}. */
function showOffline(t: (key: string) => string): void {
  toast.warning(t("You're offline"), {
    id: OFFLINE_TOAST_ID,
    description: t("Changes can't be saved until your connection comes back."),
    // Connectivity is a sticky state, not a one-off event — keep the banner up until we reconnect.
    duration: Infinity,
  });
}

/** Dismiss the offline banner and confirm reconnection with a brief toast. */
function showOnline(t: (key: string) => string): void {
  toast.dismiss(OFFLINE_TOAST_ID);
  toast.success(t("Back online"), {
    description: t("Your connection has been restored."),
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
  const {
    t,
  } = useTranslation();

  useEffect(() => {
    const onOffline = () => showOffline(t);
    const onOnline = () => showOnline(t);

    // Cover the case where the app is loaded while already offline — no `offline` event fires then.
    if (!navigator.onLine) onOffline();

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [t]);
}
