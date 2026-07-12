import { registerSW } from "virtual:pwa-register";

/**
 * App-wide service-worker registration for the installed PWA.
 *
 * This module owns the **single** registration for the whole app. It must be initialized once at
 * startup (from `main.tsx`), NOT from a route/component — the previous setup only called
 * `useRegisterSW` inside the Updates settings card, so the service worker (and, crucially,
 * vite-plugin-pwa's `autoUpdate` "reload when a new build activates" listener) was only wired up
 * while that one page was mounted. On every other page the already-installed worker just kept
 * serving its stale precache, so freshly deployed builds never appeared. Registering here makes the
 * `autoUpdate` lifecycle run on every page, so a new deploy auto-applies on the next load.
 *
 * The `registration` and the plugin's `updateServiceWorker` fn are captured into module-level refs
 * so the Settings "check / update now" controls (`usePwaUpdate`) can drive a manual check without
 * registering a second time.
 */

/** localStorage key for the last successful manual update check on this device. */
export const LAST_CHECKED_KEY = "pwa:last-update-check";
/** localStorage key for the last time a new service worker took control of this device. */
export const LAST_UPDATED_KEY = "pwa:last-update-applied";

/**
 * Result of a manual "check for updates":
 * - `updating` — a newer build was found and is being installed/applied (the page will reload).
 * - `up-to-date` — no newer build; this device is already on the latest version.
 * - `unsupported` — service workers aren't available (unsupported browser, or registration not ready).
 */
export type UpdateCheckOutcome = "updating" | "up-to-date" | "unsupported";

let registration: ServiceWorkerRegistration | undefined;
let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | undefined;
let initialized = false;

export function readTimestamp(key: string): number | null {
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

export function writeTimestamp(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  }
  catch {
    // Storage unavailable — the in-memory state still reflects the event.
  }
}

/**
 * Register the service worker for the whole app. Idempotent — safe to call more than once (e.g.
 * React StrictMode double-invoke); only the first call registers.
 */
export function initPwa(): void {
  if (initialized) return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  initialized = true;

  updateServiceWorker = registerSW({
    immediate: true,
    onRegisteredSW(_swScriptUrl, reg) {
      registration = reg;
    },
  });

  // Record when a new service worker actually takes control of this device — whether via the
  // `autoUpdate` reload or a manual apply — so the Settings "Last updated" line reflects the app
  // version actually running, app-wide (not just while the settings page is open).
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    writeTimestamp(LAST_UPDATED_KEY, Date.now());
  });
}

/** The captured registration, if it has resolved yet. */
export function getPwaRegistration(): ServiceWorkerRegistration | undefined {
  return registration;
}

/** Classify a completed `registration.update()` by whether a new worker is now in flight. */
export function classifyUpdateCheck(reg: ServiceWorkerRegistration | undefined): UpdateCheckOutcome {
  if (!reg) return "unsupported";
  // After `update()` resolves, a newly found build shows up as an installing (or, briefly, waiting)
  // worker. None present → the check found nothing new.
  return reg.installing || reg.waiting ? "updating" : "up-to-date";
}

/** Poll the server for a new service worker and report whether one was found. */
export async function runUpdateCheck(): Promise<UpdateCheckOutcome> {
  const reg = registration;
  if (!reg) return "unsupported";
  await reg.update();
  return classifyUpdateCheck(reg);
}

/** Activate a waiting service worker and reload with the latest version. */
export async function applyPwaUpdate(): Promise<void> {
  await updateServiceWorker?.(true);
}
