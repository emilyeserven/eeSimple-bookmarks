import { create } from "zustand";

import { bookmarksApi } from "@/lib/api/bookmarks";

/** One queued on-demand screenshot capture: a bookmark plus its optional capture settings. */
export interface ScreenshotJob {
  id: string;
  delayMs?: number;
  width?: number;
  height?: number;
  scrollDistance?: number;
}

/** How many captures run at once, mirroring the server bulk job's `BATCH` (services/batchFetch.ts). */
const CONCURRENCY = 3;

interface ScreenshotQueueState {
  /** Jobs waiting to start. */
  pending: ScreenshotJob[];
  /** Bookmark ids currently being captured. */
  activeIds: string[];
  /** Jobs enqueued in the current run (0 = idle). */
  total: number;
  /** Captures that succeeded this run. */
  completed: number;
  /** Captures that failed this run. */
  failed: number;
  /**
   * Distinct bookmark ids enqueued in the current run. When a run captures exactly one bookmark, the
   * completion toast links to it (`/bookmarks/<id>`); a multi-bookmark run has no single target.
   */
  runBookmarkIds: string[];
  /**
   * Queue a bookmark for capture. Starts a fresh run (resets the counters) when the previous run has
   * fully drained, otherwise appends to the run in progress. Kicks the concurrency-limited pump.
   */
  enqueue: (job: ScreenshotJob) => void;
}

export const useScreenshotQueueStore = create<ScreenshotQueueState>(set => ({
  pending: [],
  activeIds: [],
  total: 0,
  completed: 0,
  failed: 0,
  runBookmarkIds: [],
  enqueue: (job) => {
    set((state) => {
      const drained = state.pending.length === 0
        && state.activeIds.length === 0
        && state.completed + state.failed === state.total;
      const prevTotal = drained ? 0 : state.total;
      const prevRunIds = drained ? [] : state.runBookmarkIds;
      return {
        pending: [...state.pending, job],
        total: prevTotal + 1,
        completed: drained ? 0 : state.completed,
        failed: drained ? 0 : state.failed,
        runBookmarkIds: prevRunIds.includes(job.id) ? prevRunIds : [...prevRunIds, job.id],
      };
    });
    pump();
  },
}));

/**
 * Start as many pending captures as the concurrency budget allows. Each head job is moved from
 * `pending` to `activeIds` synchronously inside one `set()`, so overlapping `pump()` calls can never
 * double-start the same job. Runs itself off the store — no React mount required.
 */
function pump(): void {
  const store = useScreenshotQueueStore;
  while (store.getState().activeIds.length < CONCURRENCY) {
    const job = store.getState().pending[0];
    if (!job) break;
    store.setState(state => ({
      pending: state.pending.slice(1),
      activeIds: [...state.activeIds, job.id],
    }));
    void runCapture(job);
  }
}

/** Capture one screenshot, record the outcome, then pump the next job. Never throws. */
async function runCapture(job: ScreenshotJob): Promise<void> {
  const ok = await bookmarksApi
    .takeScreenshot(job.id, job.delayMs, job.width, job.height, job.scrollDistance)
    .then(() => true)
    .catch(() => false);
  useScreenshotQueueStore.setState(state => ({
    activeIds: state.activeIds.filter(id => id !== job.id),
    completed: state.completed + (ok ? 1 : 0),
    failed: state.failed + (ok ? 0 : 1),
  }));
  pump();
}

/** Selector: is this bookmark currently queued or capturing? Drives the trigger buttons' state. */
export const selectIsBookmarkQueued
  = (id: string) => (state: ScreenshotQueueState): boolean =>
    state.activeIds.includes(id) || state.pending.some(job => job.id === id);
