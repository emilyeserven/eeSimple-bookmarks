import assert from "node:assert/strict";
import { test } from "node:test";
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
