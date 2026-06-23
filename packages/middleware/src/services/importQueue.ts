/**
 * A minimal in-process, sequential job queue for background import processing. Jobs run **one at a
 * time** (FIFO) so concurrent imports don't multiply outbound fetch concurrency and so
 * `createBookmark`'s website auto-create can't race across imports. This is coherent because the
 * gateway runs a single middleware child process (the same assumption `services/bookmarkCache.ts`
 * relies on) — there is no cross-process queue.
 *
 * Errors are swallowed here: each job is responsible for recording its own failure (e.g. marking the
 * import row `failed`). The queue only guarantees ordering and that one rejection never stalls the
 * chain.
 */

let tail: Promise<unknown> = Promise.resolve();

/** Append a job to the queue. Returns immediately; the job runs after all previously-enqueued jobs. */
export function enqueueImportJob(job: () => Promise<void>): void {
  tail = tail.then(job, job).catch(() => {
    // A job's own error handling is its responsibility; never let a rejection break the chain.
  });
}
