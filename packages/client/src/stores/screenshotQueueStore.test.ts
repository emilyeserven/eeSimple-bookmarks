// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { selectIsBookmarkQueued, useScreenshotQueueStore } from "./screenshotQueueStore";

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error?: unknown) => void;
}

function defer(): Deferred {
  let resolve!: () => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve,
    reject,
  };
}

const takeScreenshot = vi.fn();
let deferreds: Deferred[] = [];

vi.mock("@/lib/api/bookmarks", () => ({
  bookmarksApi: {
    takeScreenshot: (...args: unknown[]) => takeScreenshot(...args),
  },
}));

function resetStore(): void {
  useScreenshotQueueStore.setState({
    pending: [],
    activeIds: [],
    total: 0,
    completed: 0,
    failed: 0,
    runBookmarkIds: [],
  });
}

describe("screenshotQueueStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deferreds = [];
    resetStore();
    // Each capture returns a promise we resolve/reject by hand for deterministic ordering.
    takeScreenshot.mockImplementation(() => {
      const d = defer();
      deferreds.push(d);
      return d.promise;
    });
  });

  it("forwards the job's capture settings to the API", () => {
    useScreenshotQueueStore.getState().enqueue({
      id: "b1",
      delayMs: 5000,
      width: 1920,
      height: 1080,
      scrollDistance: 2000,
    });
    expect(takeScreenshot).toHaveBeenCalledWith("b1", 5000, 1920, 1080, 2000);
  });

  it("records a successful capture and drains the run", async () => {
    useScreenshotQueueStore.getState().enqueue({
      id: "b1",
    });
    expect(useScreenshotQueueStore.getState().total).toBe(1);
    expect(useScreenshotQueueStore.getState().activeIds).toEqual(["b1"]);

    deferreds[0]!.resolve();
    await vi.waitFor(() => {
      const state = useScreenshotQueueStore.getState();
      expect(state.completed).toBe(1);
      expect(state.failed).toBe(0);
      expect(state.activeIds).toEqual([]);
    });
  });

  it("records a failed capture without throwing", async () => {
    useScreenshotQueueStore.getState().enqueue({
      id: "b1",
    });
    deferreds[0]!.reject(new Error("browserless down"));
    await vi.waitFor(() => {
      const state = useScreenshotQueueStore.getState();
      expect(state.completed).toBe(0);
      expect(state.failed).toBe(1);
      expect(state.activeIds).toEqual([]);
    });
  });

  it("caps concurrency at 3 and starts the next job as one finishes", async () => {
    const {
      enqueue,
    } = useScreenshotQueueStore.getState();
    for (const id of ["a", "b", "c", "d", "e"]) enqueue({
      id,
    });

    let state = useScreenshotQueueStore.getState();
    expect(state.total).toBe(5);
    expect(state.activeIds).toHaveLength(3);
    expect(state.pending).toHaveLength(2);

    deferreds[0]!.resolve();
    await vi.waitFor(() => {
      state = useScreenshotQueueStore.getState();
      expect(state.completed).toBe(1);
      expect(state.activeIds).toHaveLength(3);
      expect(state.pending).toHaveLength(1);
    });
  });

  it("resets the counters for a fresh run after the previous one drains", async () => {
    useScreenshotQueueStore.getState().enqueue({
      id: "a",
    });
    deferreds[0]!.resolve();
    await vi.waitFor(() => expect(useScreenshotQueueStore.getState().completed).toBe(1));

    useScreenshotQueueStore.getState().enqueue({
      id: "b",
    });
    const state = useScreenshotQueueStore.getState();
    expect(state.total).toBe(1);
    expect(state.completed).toBe(0);
    expect(state.failed).toBe(0);
    expect(state.activeIds).toEqual(["b"]);
  });

  it("tracks the run's distinct bookmark ids (deduped) for the completion link", () => {
    const {
      enqueue,
    } = useScreenshotQueueStore.getState();
    enqueue({
      id: "b1",
    });
    enqueue({
      id: "b1",
    });
    enqueue({
      id: "b2",
    });
    expect(useScreenshotQueueStore.getState().runBookmarkIds).toEqual(["b1", "b2"]);
  });

  it("resets the run's bookmark ids for a fresh run after the previous one drains", async () => {
    useScreenshotQueueStore.getState().enqueue({
      id: "a",
    });
    deferreds[0]!.resolve();
    await vi.waitFor(() => expect(useScreenshotQueueStore.getState().completed).toBe(1));

    useScreenshotQueueStore.getState().enqueue({
      id: "b",
    });
    expect(useScreenshotQueueStore.getState().runBookmarkIds).toEqual(["b"]);
  });

  it("selectIsBookmarkQueued reflects pending and active ids", () => {
    const {
      enqueue,
    } = useScreenshotQueueStore.getState();
    // Fill the 3 active slots, then a 4th sits pending.
    for (const id of ["a", "b", "c", "d"]) enqueue({
      id,
    });
    const state = useScreenshotQueueStore.getState();
    expect(selectIsBookmarkQueued("a")(state)).toBe(true);
    expect(selectIsBookmarkQueued("d")(state)).toBe(true);
    expect(selectIsBookmarkQueued("nope")(state)).toBe(false);
  });
});
