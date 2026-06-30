import assert from "node:assert/strict";
import { test } from "node:test";

import {
  normalizeSocialHandle,
  sameSocialAccount,
  socialAccountFromLink,
  socialAccountFromUrl,
} from "./socialMedia.js";

test("normalizeSocialHandle strips @, trailing slash, and lowercases", () => {
  assert.equal(normalizeSocialHandle("@JaneDoe"), "janedoe");
  assert.equal(normalizeSocialHandle(" JaneDoe/ "), "janedoe");
  assert.equal(normalizeSocialHandle("janedoe"), "janedoe");
});

test("socialAccountFromUrl reads an Instagram profile", () => {
  assert.deepEqual(socialAccountFromUrl("https://www.instagram.com/JaneDoe/"), {
    platform: "instagram",
    handle: "janedoe",
    profileUrl: "https://instagram.com/janedoe",
  });
});

test("socialAccountFromUrl reads the username from a `/{user}/p/{code}` permalink", () => {
  const ref = socialAccountFromUrl("https://instagram.com/janedoe/p/AbC123/?img_index=1");
  assert.equal(ref?.platform, "instagram");
  assert.equal(ref?.handle, "janedoe");
});

test("socialAccountFromUrl returns null for a bare Instagram post/reel (no username)", () => {
  assert.equal(socialAccountFromUrl("https://instagram.com/p/AbC123/"), null);
  assert.equal(socialAccountFromUrl("https://instagram.com/reel/AbC123/"), null);
  assert.equal(socialAccountFromUrl("https://instagram.com/explore/"), null);
});

test("socialAccountFromUrl reads X/Twitter handles, mapping both hosts to `x`", () => {
  assert.deepEqual(socialAccountFromUrl("https://twitter.com/JaneDoe"), {
    platform: "x",
    handle: "janedoe",
    profileUrl: "https://x.com/janedoe",
  });
  assert.equal(socialAccountFromUrl("https://x.com/janedoe/status/123")?.handle, "janedoe");
  assert.equal(socialAccountFromUrl("https://x.com/home"), null);
});

test("socialAccountFromUrl handles Facebook profiles but skips profile.php", () => {
  assert.equal(socialAccountFromUrl("https://facebook.com/janedoe")?.handle, "janedoe");
  assert.equal(socialAccountFromUrl("https://facebook.com/profile.php?id=123"), null);
});

test("socialAccountFromUrl reads LinkedIn `/in/{slug}` only", () => {
  assert.equal(socialAccountFromUrl("https://www.linkedin.com/in/jane-doe")?.handle, "jane-doe");
  assert.equal(socialAccountFromUrl("https://www.linkedin.com/company/acme"), null);
});

test("socialAccountFromUrl excludes GitHub system paths", () => {
  assert.equal(socialAccountFromUrl("https://github.com/janedoe")?.platform, "github");
  assert.equal(socialAccountFromUrl("https://github.com/settings"), null);
  assert.equal(socialAccountFromUrl("https://github.com/janedoe/repo"), null);
});

test("socialAccountFromUrl reads a Bluesky profile", () => {
  assert.equal(
    socialAccountFromUrl("https://bsky.app/profile/jane.bsky.social")?.handle,
    "jane.bsky.social",
  );
});

test("socialAccountFromUrl rejects non-http(s) and unknown hosts", () => {
  assert.equal(socialAccountFromUrl("ftp://instagram.com/janedoe"), null);
  assert.equal(socialAccountFromUrl("https://example.com/janedoe"), null);
  assert.equal(socialAccountFromUrl("not a url"), null);
});

test("sameSocialAccount compares platform + normalized handle", () => {
  const a = socialAccountFromUrl("https://instagram.com/JaneDoe")!;
  const b = socialAccountFromUrl("https://www.instagram.com/janedoe/")!;
  assert.equal(sameSocialAccount(a, b), true);
  const c = socialAccountFromUrl("https://x.com/janedoe")!;
  assert.equal(sameSocialAccount(a, c), false);
});

test("socialAccountFromLink builds a ref from a stored SocialLink", () => {
  const ref = socialAccountFromLink({
    platform: "instagram",
    url: "https://instagram.com/janedoe",
  });
  assert.equal(ref?.handle, "janedoe");
});
