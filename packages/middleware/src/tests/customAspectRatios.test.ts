import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";

// Schema-validation tests via `inject` (no database needed).

test("POST /api/custom-aspect-ratios rejects a payload missing the name", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/custom-aspect-ratios",
    payload: {
      width: 16,
      height: 9,
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/custom-aspect-ratios rejects a payload missing the width", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/custom-aspect-ratios",
    payload: {
      name: "Wide",
      height: 9,
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/custom-aspect-ratios rejects a zero width", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/custom-aspect-ratios",
    payload: {
      name: "Wide",
      width: 0,
      height: 9,
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/custom-aspect-ratios rejects a non-integer height", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/custom-aspect-ratios",
    payload: {
      name: "Wide",
      width: 16,
      height: 9.5,
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("DELETE /api/custom-aspect-ratios/:id rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "DELETE",
    url: "/api/custom-aspect-ratios/not-a-uuid",
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
