import { setCurrentNotificationPage } from "@/lib/notificationPage";
import { __resetPwaForTests } from "@/lib/pwa";
import { useBasketStore } from "@/stores/basketStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useScreenshotQueueStore } from "@/stores/screenshotQueueStore";
import { useUiStore } from "@/stores/uiStore";

interface ResettableStore<S> {
  getInitialState: () => S;
  setState: (state: S, replace: true) => unknown;
}

function resetStore<S>(store: ResettableStore<S>): void {
  store.setState(store.getInitialState(), true);
}

/**
 * Plain reset callbacks for module-level singletons that aren't zustand stores. Register one here
 * (or via {@link registerReset}) whenever a mutable module singleton that tests can touch is added —
 * the symptom of a missing reset is a test that passes alone but fails in the full non-isolated run.
 *
 * Deliberately NOT registered:
 * - `lib/locationMapMarkers`' icon cache — a deterministic, input-keyed cache; stale entries can't
 *   change any observable output, so resetting it would only churn.
 * - `components/…` draft counters owned by in-flight work elsewhere.
 */
const resetCallbacks: (() => void)[] = [];

/** Register a plain reset callback to run alongside the zustand-store resets. Idempotent per fn. */
export function registerReset(fn: () => void): void {
  if (!resetCallbacks.includes(fn)) resetCallbacks.push(fn);
}

// `lib/notificationPage`'s current-page holder — restore the app-boot default.
registerReset(() => setCurrentNotificationPage({
  pathname: "/",
  label: "",
}));

// `lib/pwa`'s captured registration / updater / initialized flag.
registerReset(__resetPwaForTests);

/**
 * Restore every module-singleton the tests can mutate — the zustand stores plus the registered
 * plain callbacks — to its initial state. When tests run with `isolate: false`, these modules live
 * for the whole worker, so each test file must start from the same state a fresh environment used
 * to provide.
 */
export function resetAllStores(): void {
  resetStore(useBasketStore);
  resetStore(useNotificationStore);
  resetStore(useScreenshotQueueStore);
  resetStore(useUiStore);
  for (const fn of resetCallbacks) fn();
}
