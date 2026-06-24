import assert from "node:assert/strict";
import { test } from "node:test";

import { bulkDeleteEntities } from "@/services/bulkDelete";

class BuiltInError extends Error {}

test("bulkDeleteEntities reports deleted vs not-found per item", async () => {
  const present = new Set(["a", "c"]);
  const results = await bulkDeleteEntities(
    ["a", "b", "c"],
    async id => present.has(id),
  );
  assert.deepEqual(results, [
    {
      id: "a",
      status: "deleted",
    },
    {
      id: "b",
      status: "not-found",
    },
    {
      id: "c",
      status: "deleted",
    },
  ]);
});

test("bulkDeleteEntities classifies a built-in guard error as skipped-built-in", async () => {
  const results = await bulkDeleteEntities(
    ["builtin", "ok"],
    async (id) => {
      if (id === "builtin") throw new BuiltInError("cannot delete built-in");
      return true;
    },
    err => err instanceof BuiltInError,
  );
  assert.equal(results[0]?.status, "skipped-built-in");
  assert.equal(results[0]?.message, "cannot delete built-in");
  assert.equal(results[1]?.status, "deleted");
});

test("bulkDeleteEntities reports an unexpected throw as error without aborting the batch", async () => {
  const results = await bulkDeleteEntities(
    ["boom", "ok"],
    async (id) => {
      if (id === "boom") throw new Error("db exploded");
      return true;
    },
  );
  assert.equal(results[0]?.status, "error");
  assert.equal(results[0]?.message, "db exploded");
  assert.equal(results[1]?.status, "deleted");
});
