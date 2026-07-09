import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

test("GET /api/extension/fill-context rejects a request with no url", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/extension/fill-context",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("GET /api/extension/fill-context rejects a blank url", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/extension/fill-context?url=",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
