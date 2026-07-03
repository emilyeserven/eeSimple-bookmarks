import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

// Schema-validation route tests run without a live database — the querystring is rejected before the
// handler (and any DB lookup) runs.

test("GET /api/people/:id/image/source-preview rejects a request with no source", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/people/11111111-1111-1111-1111-111111111111/image/source-preview",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("GET /api/people/:id/image/source-preview rejects an unknown source", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/people/11111111-1111-1111-1111-111111111111/image/source-preview?source=bogus",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
