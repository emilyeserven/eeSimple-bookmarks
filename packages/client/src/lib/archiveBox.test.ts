// @vitest-environment node
import { describe, expect, it } from "vitest";

import { archiveAddUrl, archiveSearchUrl } from "./archiveBox";

describe("archiveSearchUrl", () => {
  it("builds a public-index search URL for the given bookmark URL", () => {
    expect(archiveSearchUrl("https://archive.example.com", "https://news.site/post")).toBe(
      "https://archive.example.com/?q=https%3A%2F%2Fnews.site%2Fpost",
    );
  });

  it("trims a single trailing slash on the base URL before appending", () => {
    expect(archiveSearchUrl("https://archive.example.com/", "https://x.test")).toBe(
      "https://archive.example.com/?q=https%3A%2F%2Fx.test",
    );
  });

  it("URL-encodes query strings and special characters in the target URL", () => {
    expect(archiveSearchUrl("https://a.test", "https://x.test/p?a=1&b=2")).toBe(
      "https://a.test/?q=https%3A%2F%2Fx.test%2Fp%3Fa%3D1%26b%3D2",
    );
  });
});

describe("archiveAddUrl", () => {
  it("builds an add-view URL pre-filled with the bookmark URL", () => {
    expect(archiveAddUrl("https://archive.example.com", "https://news.site/post")).toBe(
      "https://archive.example.com/add?url=https%3A%2F%2Fnews.site%2Fpost",
    );
  });

  it("trims a trailing slash on the base URL", () => {
    expect(archiveAddUrl("https://archive.example.com/", "https://x.test")).toBe(
      "https://archive.example.com/add?url=https%3A%2F%2Fx.test",
    );
  });
});
