// @vitest-environment node
import type { ScanResult } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildBookmarkDiff } from "./bookmarkDiff";

function scan(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    finalUrl: "https://example.com/post",
    redirected: false,
    title: "Fresh Title",
    description: "Fresh description.",
    isYouTube: false,
    channel: null,
    durationSeconds: null,
    datePosted: null,
    thumbnailUrl: "https://img.example/thumb.jpg",
    imageCandidates: [],
    authorNames: [],
    languageCode: null,
    socialAccount: null,
    faviconUrl: null,
    website: null,
    duplicate: null,
    ...overrides,
  } as ScanResult;
}

describe("buildBookmarkDiff", () => {
  it("offers title, description, and page image when the bookmark is empty (all fill-empty checked)", () => {
    const diff = buildBookmarkDiff(scan(), {
      title: "",
      description: null,
      imageUrl: null,
    });
    const rows = diff.groups[0].rows;
    expect(rows.map(r => r.key)).toEqual(["title", "description", "image"]);
    expect(rows.every(r => r.defaultChecked)).toBe(true);
    const image = rows.find(r => r.key === "image");
    expect(image?.kind).toBe("image");
    expect(image?.nextThumb).toBe("https://img.example/thumb.jpg");
    expect(image?.applyImmediately).toBe(true);
  });

  it("leaves a differing populated field unchecked by default (no blind overwrite)", () => {
    const diff = buildBookmarkDiff(scan(), {
      title: "My own title",
      description: "Fresh description.",
      imageUrl: null,
    });
    const rows = diff.groups[0].rows;
    const title = rows.find(r => r.key === "title");
    expect(title?.defaultChecked).toBe(false);
    expect(title?.current).toBe("My own title");
    expect(rows.map(r => r.key)).not.toContain("description"); // already matches
  });

  it("falls back to the first image candidate when there is no thumbnail", () => {
    const diff = buildBookmarkDiff(scan({
      thumbnailUrl: null,
      imageCandidates: [{
        url: "https://img.example/candidate.png",
        source: "og",
      }],
    }), {
      title: "Fresh Title",
      description: "Fresh description.",
      imageUrl: null,
    });
    const image = diff.groups[0].rows.find(r => r.key === "image");
    expect(image?.nextThumb).toBe("https://img.example/candidate.png");
  });

  it("carries a typed payload for staging vs immediate image apply", () => {
    const diff = buildBookmarkDiff(scan(), {
      title: "",
      description: null,
      imageUrl: null,
    });
    const rows = diff.groups[0].rows;
    expect(rows.find(r => r.key === "title")?.payload).toEqual({
      kind: "field",
      field: "title",
      value: "Fresh Title",
    });
    expect(rows.find(r => r.key === "image")?.payload).toEqual({
      kind: "image",
      image: "og",
    });
  });
});
