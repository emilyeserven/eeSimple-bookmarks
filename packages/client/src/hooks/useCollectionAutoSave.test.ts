import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCollectionAutoSave } from "./useCollectionAutoSave";

import { useNotificationStore } from "@/stores/notificationStore";

/**
 * Mock-free: persistence is a plain callback-style fake, and toasts are asserted through the real
 * notify path's persistent Notifications log (the store), not by mocking `lib/autoSave`. The
 * debounce runs on real timers with a tiny `debounceMs`.
 */

const DEBOUNCE_MS = 5;

/** Wait long enough for any pending debounced save to have fired. */
async function flushDebounce(): Promise<void> {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, DEBOUNCE_MS * 6));
  });
}

/** A fake persist matching the `mutate(value, { onSuccess, onError })` callback shape. */
function makePersist(behavior: "success" | "error" = "success") {
  return vi.fn(
    (
      _value: string[],
      callbacks: { onSuccess: () => void;
        onError: (error: Error) => void; },
    ) => {
      if (behavior === "success") callbacks.onSuccess();
      else callbacks.onError(new Error("boom"));
    },
  );
}

function loggedMessages(): string[] {
  return useNotificationStore.getState().notifications.map(n => n.message);
}

function renderCollectionAutoSave(
  persist: ReturnType<typeof makePersist>,
  initial?: string[],
) {
  return renderHook(() =>
    useCollectionAutoSave<string[]>({
      id: "b1",
      label: "Related bookmarks",
      persist,
      initial,
      debounceMs: DEBOUNCE_MS,
    }));
}

describe("useCollectionAutoSave", () => {
  beforeEach(() => {
    useNotificationStore.getState().clearNotifications();
  });

  it("seeds the snapshot from the first queueSave without saving (initial load)", async () => {
    const persist = makePersist();
    const {
      result,
    } = renderCollectionAutoSave(persist);

    act(() => result.current.queueSave(["a"]));
    await flushDebounce();

    expect(persist).not.toHaveBeenCalled();
    expect(loggedMessages()).toEqual([]);
  });

  it("debounce-persists a changed collection once, coalescing rapid edits, and toasts the section", async () => {
    const persist = makePersist();
    const {
      result,
    } = renderCollectionAutoSave(persist, ["a"]);

    act(() => result.current.queueSave(["a", "b"]));
    act(() => result.current.queueSave(["a", "b", "c"]));
    await flushDebounce();

    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist.mock.calls[0]![0]).toEqual(["a", "b", "c"]);
    expect(loggedMessages()).toHaveLength(1);
    expect(loggedMessages()[0]).toContain("Related bookmarks");
  });

  it("skips a no-op (deep-equal to the last saved collection)", async () => {
    const persist = makePersist();
    const {
      result,
    } = renderCollectionAutoSave(persist, ["a", "b"]);

    act(() => result.current.queueSave(["a", "b"]));
    await flushDebounce();

    expect(persist).not.toHaveBeenCalled();
  });

  it("cancels a pending save when the value settles back to the snapshot", async () => {
    const persist = makePersist();
    const {
      result,
    } = renderCollectionAutoSave(persist, ["a"]);

    act(() => result.current.queueSave(["a", "b"]));
    act(() => result.current.queueSave(["a"]));
    await flushDebounce();

    expect(persist).not.toHaveBeenCalled();
  });

  it("advances the snapshot only on success, so the same value isn't saved twice", async () => {
    const persist = makePersist();
    const {
      result,
    } = renderCollectionAutoSave(persist, []);

    act(() => result.current.queueSave(["a"]));
    await flushDebounce();
    act(() => result.current.queueSave(["a"]));
    await flushDebounce();

    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("keeps the snapshot on failure (retry fires again) and logs a section-named error", async () => {
    const persist = makePersist("error");
    const {
      result,
    } = renderCollectionAutoSave(persist, []);

    act(() => result.current.queueSave(["a"]));
    await flushDebounce();
    act(() => result.current.queueSave(["a"]));
    await flushDebounce();

    expect(persist).toHaveBeenCalledTimes(2);
    expect(useNotificationStore.getState().notifications.every(n => n.type === "error")).toBe(true);
    expect(loggedMessages()[0]).toContain("Related bookmarks");
  });

  it("saveNow persists immediately (no debounce) and skips no-ops against the initial snapshot", () => {
    const persist = makePersist();
    const {
      result,
    } = renderCollectionAutoSave(persist, ["a"]);

    act(() => result.current.saveNow(["a"]));
    expect(persist).not.toHaveBeenCalled();

    act(() => result.current.saveNow(["a", "b"]));
    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist.mock.calls[0]![0]).toEqual(["a", "b"]);
    expect(loggedMessages()).toHaveLength(1);
  });

  it("cancels a pending debounced save on unmount", async () => {
    const persist = makePersist();
    const {
      result, unmount,
    } = renderCollectionAutoSave(persist, ["a"]);

    act(() => result.current.queueSave(["a", "b"]));
    unmount();
    await flushDebounce();

    expect(persist).not.toHaveBeenCalled();
  });
});
