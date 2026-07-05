import { useEffect, useRef } from "react";

import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const SERVER_UNREACHABLE_TOAST_ID = "server-unreachable";
/** How often to re-probe the server when the browser is online. */
const PROBE_INTERVAL_MS = 15_000;
/** Per-probe timeout — abort after this many ms to avoid hanging indefinitely. */
const PROBE_TIMEOUT_MS = 5_000;

async function probeServer(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch("/api/healthz", {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  }
  catch {
    return false;
  }
}

function showServerUnreachable(t: (key: string) => string): void {
  toast.warning(t("Can't reach the server"), {
    id: SERVER_UNREACHABLE_TOAST_ID,
    description: t(
      "You're online but the app server isn't responding. If you use Tailscale, make sure it's connected.",
    ),
    duration: Infinity,
  });
}

function showServerReconnected(t: (key: string) => string): void {
  toast.dismiss(SERVER_UNREACHABLE_TOAST_ID);
  toast.success(t("Server reconnected"), {
    description: t("The app server is reachable again."),
  });
}

type ServerState = "unknown" | "reachable" | "unreachable";

/**
 * Periodically probe the app's own server and surface a warning when the browser is online but
 * the server isn't reachable — the typical Tailscale-disconnected scenario.
 *
 * Complements {@link useOfflineToast} which covers the case where the browser itself has no network.
 * Mount once, globally (see {@link RootLayout}).
 */
export function useServerUnreachableToast(): void {
  const {
    t,
  } = useTranslation();
  const stateRef = useRef<ServerState>("unknown");

  useEffect(() => {
    async function checkServer(): Promise<void> {
      if (!navigator.onLine) {
        // Device is offline — the useOfflineToast banner takes over; clear any server-unreachable state.
        if (stateRef.current === "unreachable") {
          stateRef.current = "unknown";
          toast.dismiss(SERVER_UNREACHABLE_TOAST_ID);
        }
        return;
      }

      const reachable = await probeServer();
      const prev = stateRef.current;
      const next: ServerState = reachable ? "reachable" : "unreachable";
      if (next === prev) return;

      stateRef.current = next;
      if (!reachable) {
        showServerUnreachable(t);
      }
      else if (prev === "unreachable") {
        // Only show "reconnected" after we've previously shown "unreachable" — not on first success.
        showServerReconnected(t);
      }
    }

    void checkServer();

    const intervalId = setInterval(() => void checkServer(), PROBE_INTERVAL_MS);

    // Re-probe immediately on online events to detect VPN reconnects quickly.
    const handleOnline = () => void checkServer();
    window.addEventListener("online", handleOnline);

    // When the device goes offline the useOfflineToast banner takes over; clear ours.
    const handleOffline = () => {
      if (stateRef.current === "unreachable") {
        stateRef.current = "unknown";
        toast.dismiss(SERVER_UNREACHABLE_TOAST_ID);
      }
    };
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [t]);
}
