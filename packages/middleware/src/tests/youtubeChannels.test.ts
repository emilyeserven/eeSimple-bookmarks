import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "@/app";
import { channelKeyFromUrl } from "@/services/youtubeChannels";

// Pure-helper tests run without a live database.

test("channelKeyFromUrl prefers an @handle, lowercased", () => {
  assert.equal(channelKeyFromUrl("https://www.youtube.com/@SomeChannel"), "@somechannel");
});

test("channelKeyFromUrl keeps a /channel/<id> case-sensitive", () => {
  assert.equal(
    channelKeyFromUrl("https://www.youtube.com/channel/UCabcDEF123"),
    "UCabcDEF123",
  );
});

test("channelKeyFromUrl lowercases /c/ and /user/ vanity names", () => {
  assert.equal(channelKeyFromUrl("https://www.youtube.com/c/MyVanity"), "myvanity");
  assert.equal(channelKeyFromUrl("https://www.youtube.com/user/OldUser"), "olduser");
});

test("channelKeyFromUrl falls back to the last path segment, lowercased", () => {
  assert.equal(channelKeyFromUrl("https://www.youtube.com/SomeName"), "somename");
});

test("channelKeyFromUrl returns null for an unparseable URL or an empty path", () => {
  assert.equal(channelKeyFromUrl("not a url"), null);
  assert.equal(channelKeyFromUrl("https://www.youtube.com/"), null);
});

// Schema-validation tests via `inject` (no database needed).

test("POST /api/youtube-channels rejects a payload missing the channelUrl", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/youtube-channels",
    payload: {
      name: "My Channel",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/youtube-channels rejects a payload missing the name", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/youtube-channels",
    payload: {
      channelUrl: "https://www.youtube.com/@x",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("POST /api/youtube-channels rejects an empty name", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/youtube-channels",
    payload: {
      channelUrl: "https://www.youtube.com/@x",
      name: "",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/youtube-channels/:id rejects a non-uuid id", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/youtube-channels/not-a-uuid",
    payload: {
      name: "x",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/youtube-channels/:id rejects a non-uuid tagId", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/youtube-channels/11111111-1111-1111-1111-111111111111",
    payload: {
      tagIds: ["not-a-uuid"],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/youtube-channels/:id rejects a non-uuid websiteId", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/youtube-channels/11111111-1111-1111-1111-111111111111",
    payload: {
      websiteIds: ["not-a-uuid"],
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});

test("PATCH /api/youtube-channels/:id rejects an empty name", async () => {
  const app = await buildApp();
  const res = await app.inject({
    method: "PATCH",
    url: "/api/youtube-channels/11111111-1111-1111-1111-111111111111",
    payload: {
      name: "",
    },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
