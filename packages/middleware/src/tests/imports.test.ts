import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

test("POST /api/imports/ingest/url rejects a private (SSRF) URL", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/imports/ingest/url",
    payload: {
      url: "http://localhost/post",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
