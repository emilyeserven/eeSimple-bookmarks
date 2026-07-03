// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildPodcastDiff, type PodcastDiffCurrent, type PodcastDiffSource } from "./podcastDiff";

const EMPTY_CURRENT: PodcastDiffCurrent = {
  name: null,
  author: null,
  description: null,
  imageUrl: null,
  itunesUrl: null,
  pocketCastsUrl: null,
};

const EMPTY_SOURCE: PodcastDiffSource = {
  title: null,
  author: null,
  description: null,
  imageUrl: null,
  itunesUrl: null,
  pocketCastsUrl: null,
};

describe("buildPodcastDiff", () => {
  it("returns an empty diff when the source offers nothing", () => {
    expect(buildPodcastDiff(EMPTY_CURRENT, EMPTY_SOURCE, "Podcast feed").groups).toEqual([]);
  });

  it("offers name/author/description + artwork (checked, fill-empty) when current is empty", () => {
    const source: PodcastDiffSource = {
      ...EMPTY_SOURCE,
      title: "Reply All",
      author: "Gimlet",
      description: "A podcast about the internet.",
      imageUrl: "https://cdn.example.com/art.jpg",
    };
    const diff = buildPodcastDiff(EMPTY_CURRENT, source, "Podcast feed");
    const rows = diff.groups[0].rows;
    expect(rows.map(r => r.key)).toEqual(["name", "author", "description", "artwork"]);
    expect(rows.every(r => r.defaultChecked)).toBe(true);
    const artwork = rows.find(r => r.key === "artwork");
    expect(artwork?.kind).toBe("image");
    expect(artwork?.applyImmediately).toBe(true);
    expect(artwork?.nextThumb).toBe("https://cdn.example.com/art.jpg");
  });

  it("offers cross-resolved service-link rows carrying an isLink payload", () => {
    const source: PodcastDiffSource = {
      ...EMPTY_SOURCE,
      itunesUrl: "https://podcasts.apple.com/us/podcast/id123",
      pocketCastsUrl: "https://pca.st/podcast/abc",
    };
    const rows = buildPodcastDiff(EMPTY_CURRENT, source, "Podcast feed").groups[0].rows;
    expect(rows.map(r => r.key)).toEqual(["itunesUrl", "pocketCastsUrl"]);
    expect(rows[0].kind).toBe("text");
    expect(rows[0].payload).toEqual({
      field: "itunesUrl",
      value: "https://podcasts.apple.com/us/podcast/id123",
      isLink: true,
    });
  });

  it("marks a would-overwrite text row unchecked (fill-empty default off)", () => {
    const current: PodcastDiffCurrent = {
      ...EMPTY_CURRENT,
      name: "Old Name",
    };
    const source: PodcastDiffSource = {
      ...EMPTY_SOURCE,
      title: "New Name",
    };
    const row = buildPodcastDiff(current, source, "Podcast feed").groups[0].rows[0];
    expect(row.key).toBe("name");
    expect(row.defaultChecked).toBe(false);
    expect(row.payload).toEqual({
      field: "name",
      value: "New Name",
    });
  });

  it("skips text fields that are already in sync", () => {
    const current: PodcastDiffCurrent = {
      ...EMPTY_CURRENT,
      name: "Same",
      author: "Same Author",
    };
    const source: PodcastDiffSource = {
      ...EMPTY_SOURCE,
      title: "Same",
      author: "Same Author",
    };
    expect(buildPodcastDiff(current, source, "Podcast feed").groups).toEqual([]);
  });
});
