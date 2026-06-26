import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { ConnectorsStatus } from "@eesimple/types";
import { buildApp } from "@/app";

afterEach(() => {
  delete process.env.HOSTED_METADATA_ENDPOINT;
  delete process.env.HOSTED_METADATA_PROVIDER;
  delete process.env.YOUTUBE_API_KEY;
});

test("GET /api/connectors reports gated connectors as inactive by default", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/connectors",
  });
  assert.equal(res.statusCode, 200);
  const body = res.json() as ConnectorsStatus;
  assert.equal(body.hostedMetadata.enabled, false);
  assert.equal(body.hostedMetadata.provider, null);
  assert.equal(body.youtubeDataApi.enabled, false);
  await app.close();
});

test("GET /api/connectors reflects configured env vars", async () => {
  process.env.HOSTED_METADATA_ENDPOINT = "https://api.microlink.io/";
  process.env.HOSTED_METADATA_PROVIDER = "microlink";
  process.env.YOUTUBE_API_KEY = "test-key";
  const app = await buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/api/connectors",
  });
  assert.equal(res.statusCode, 200);
  const body = res.json() as ConnectorsStatus;
  assert.equal(body.hostedMetadata.enabled, true);
  assert.equal(body.hostedMetadata.provider, "microlink");
  assert.equal(body.youtubeDataApi.enabled, true);
  await app.close();
});
