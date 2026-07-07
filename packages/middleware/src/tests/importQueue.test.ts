import assert from "node:assert/strict";
import { test } from "node:test";
import { enqueueImportJob } from "@/services/importQueue";

// `enqueueImportJob` chains jobs onto a module-level `tail` promise, so ordering guarantees only
// hold for jobs enqueued in the same synchronous tick relative to each other's `tail` state — each
// test enqueues its jobs back-to-back and awaits the last one to observe the full chain.

test("enqueueImportJob: runs jobs in FIFO order", async () => {
  const order: number[] = [];
  let done: () => void;
  const finished = new Promise<void>((resolve) => {
    done = resolve;
  });

  enqueueImportJob(async () => {
    order.push(1);
  });
  enqueueImportJob(async () => {
    order.push(2);
  });
  enqueueImportJob(async () => {
    order.push(3);
    done();
  });

  await finished;
  assert.deepEqual(order, [1, 2, 3]);
});

test("enqueueImportJob: a job that throws does not block a subsequently enqueued job", async () => {
  const order: string[] = [];
  let done: () => void;
  const finished = new Promise<void>((resolve) => {
    done = resolve;
  });

  enqueueImportJob(async () => {
    order.push("first");
  });
  enqueueImportJob(async () => {
    order.push("throws");
    throw new Error("boom");
  });
  enqueueImportJob(async () => {
    order.push("after-throw");
    done();
  });

  await finished;
  assert.deepEqual(order, ["first", "throws", "after-throw"]);
});
