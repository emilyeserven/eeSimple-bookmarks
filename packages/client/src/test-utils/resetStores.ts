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
 * Restore every module-singleton zustand store to its initial state. When tests run with
 * `isolate: false`, the store modules live for the whole worker, so each test file must start
 * from the same state a fresh environment used to provide.
 */
export function resetAllStores(): void {
  resetStore(useBasketStore);
  resetStore(useNotificationStore);
  resetStore(useScreenshotQueueStore);
  resetStore(useUiStore);
}
