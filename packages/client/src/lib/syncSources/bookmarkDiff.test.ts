// @vitest-environment node
import type { ScanResult } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import {
  buildBookmarkDiff,
  buildBookmarkIsbnDiff,
  buildBookmarkKavitaDiff,
  buildBookmarkPlexDiff,
  buildBookmarkPodcastDiff,
  type BookmarkIsbnDiffCurrent,
  type BookmarkIsbnDiffSource,
  type BookmarkKavitaDiffCurrent,
  type BookmarkKavitaDiffSource,
  type BookmarkPlexDiffCurrent,
  type BookmarkPlexDiffSource,
  type BookmarkPodcastDiffCurrent,
  type BookmarkPodcastDiffSource,
} from "./bookmarkDiff";

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
    isbn: null,
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

const EMPTY_PLEX_CURRENT: BookmarkPlexDiffCurrent = {
  title: null,
  wikipediaLinkEn: null,
  wikipediaLinkLocal: null,
  imageUrl: null,
};
const EMPTY_PLEX_SOURCE: BookmarkPlexDiffSource = {
  name: null,
  wikipediaLinkEn: null,
  wikipediaLinkLocal: null,
  posterUrl: null,
};

describe("buildBookmarkPlexDiff", () => {
  it("returns an empty diff when the source offers nothing", () => {
    expect(buildBookmarkPlexDiff(EMPTY_PLEX_CURRENT, EMPTY_PLEX_SOURCE, "Plex").groups).toEqual([]);
  });

  it("stages the native name into title and offers Wikipedia links (fill-empty checked)", () => {
    const source: BookmarkPlexDiffSource = {
      name: "Parasite",
      wikipediaLinkEn: "https://en.wikipedia.org/wiki/Parasite_(2019_film)",
      wikipediaLinkLocal: "https://ko.wikipedia.org/wiki/기생충_(영화)",
      posterUrl: null,
    };
    const diff = buildBookmarkPlexDiff(EMPTY_PLEX_CURRENT, source, "Plex");
    const rows = diff.groups[0].rows;
    expect(diff.groups[0].source).toBe("Plex");
    expect(rows.map(r => r.key)).toEqual(["plexName", "wikipediaLinkEn", "wikipediaLinkLocal"]);
    expect(rows.every(r => r.defaultChecked)).toBe(true);
    expect(rows.find(r => r.key === "plexName")?.payload).toEqual({
      kind: "field",
      field: "title",
      value: "Parasite",
    });
  });

  it("adds an immediate poster image row with a distinct image payload", () => {
    const rows = buildBookmarkPlexDiff({
      ...EMPTY_PLEX_CURRENT,
      imageUrl: "https://img/current.webp",
    }, {
      ...EMPTY_PLEX_SOURCE,
      posterUrl: "/api/plex/poster?ratingKey=42",
    }, "Plex").groups[0].rows;
    const poster = rows.find(r => r.key === "plex-poster");
    expect(poster?.kind).toBe("image");
    expect(poster?.applyImmediately).toBe(true);
    expect(poster?.defaultChecked).toBe(false);
    expect(poster?.payload).toEqual({
      kind: "image",
      image: "plex-poster",
    });
  });
});

const EMPTY_PODCAST_CURRENT: BookmarkPodcastDiffCurrent = {
  title: null,
  description: null,
  itunesUrl: null,
  pocketCastsUrl: null,
  imageUrl: null,
};
const EMPTY_PODCAST_SOURCE: BookmarkPodcastDiffSource = {
  title: null,
  description: null,
  itunesUrl: null,
  pocketCastsUrl: null,
  imageUrl: null,
};

describe("buildBookmarkPodcastDiff", () => {
  it("returns an empty diff when the source offers nothing", () => {
    expect(buildBookmarkPodcastDiff(EMPTY_PODCAST_CURRENT, EMPTY_PODCAST_SOURCE, "Podcast feed").groups).toEqual([]);
  });

  it("stages name/description into title/description and offers link rows", () => {
    const source: BookmarkPodcastDiffSource = {
      title: "The Daily",
      description: "News, explained.",
      itunesUrl: "https://podcasts.apple.com/us/podcast/the-daily/id1200361736",
      pocketCastsUrl: "https://pca.st/abc123",
      imageUrl: null,
    };
    const rows = buildBookmarkPodcastDiff(EMPTY_PODCAST_CURRENT, source, "Podcast feed").groups[0].rows;
    expect(rows.map(r => r.key)).toEqual(["podcastName", "podcastDescription", "itunesUrl", "pocketCastsUrl"]);
    expect(rows.find(r => r.key === "podcastName")?.payload).toEqual({
      kind: "field",
      field: "title",
      value: "The Daily",
    });
    expect(rows.find(r => r.key === "itunesUrl")?.payload).toEqual({
      kind: "field",
      field: "itunesUrl",
      value: "https://podcasts.apple.com/us/podcast/the-daily/id1200361736",
    });
  });

  it("adds an immediate artwork image row when the feed has one", () => {
    const rows = buildBookmarkPodcastDiff(EMPTY_PODCAST_CURRENT, {
      ...EMPTY_PODCAST_SOURCE,
      imageUrl: "https://img/artwork.jpg",
    }, "Podcast feed").groups[0].rows;
    const artwork = rows.find(r => r.key === "podcast-artwork");
    expect(artwork?.kind).toBe("image");
    expect(artwork?.applyImmediately).toBe(true);
    expect(artwork?.payload).toEqual({
      kind: "image",
      image: "podcast-artwork",
    });
  });
});

const EMPTY_KAVITA_CURRENT: BookmarkKavitaDiffCurrent = {
  kavitaSeriesName: null,
  imageUrl: null,
};
const EMPTY_KAVITA_SOURCE: BookmarkKavitaDiffSource = {
  name: null,
  coverUrl: null,
};

describe("buildBookmarkKavitaDiff", () => {
  it("returns an empty diff when the source offers nothing", () => {
    expect(buildBookmarkKavitaDiff(EMPTY_KAVITA_CURRENT, EMPTY_KAVITA_SOURCE, "Kavita").groups).toEqual([]);
  });

  it("offers the live series name (fill-empty checked) and an immediate cover row", () => {
    const rows = buildBookmarkKavitaDiff(EMPTY_KAVITA_CURRENT, {
      name: "One Piece",
      coverUrl: "/api/kavita/series/42/cover",
    }, "Kavita").groups[0].rows;
    expect(rows.map(r => r.key)).toEqual(["kavitaSeriesName", "kavita-cover"]);
    expect(rows.find(r => r.key === "kavitaSeriesName")?.defaultChecked).toBe(true);
    expect(rows.find(r => r.key === "kavitaSeriesName")?.payload).toEqual({
      kind: "field",
      field: "kavitaSeriesName",
      value: "One Piece",
    });
    const cover = rows.find(r => r.key === "kavita-cover");
    expect(cover?.applyImmediately).toBe(true);
    expect(cover?.payload).toEqual({
      kind: "image",
      image: "kavita-cover",
    });
  });

  it("skips the name row when it already matches", () => {
    const rows = buildBookmarkKavitaDiff({
      ...EMPTY_KAVITA_CURRENT,
      kavitaSeriesName: "One Piece",
    }, {
      ...EMPTY_KAVITA_SOURCE,
      name: "One Piece",
    }, "Kavita").groups[0]?.rows ?? [];
    expect(rows.map(r => r.key)).toEqual([]);
  });
});

const EMPTY_ISBN_CURRENT: BookmarkIsbnDiffCurrent = {
  title: null,
  description: null,
  imageUrl: null,
};
const EMPTY_ISBN_SOURCE: BookmarkIsbnDiffSource = {
  title: null,
  description: null,
  coverUrl: null,
};

describe("buildBookmarkIsbnDiff", () => {
  it("returns an empty diff when the source offers nothing", () => {
    expect(buildBookmarkIsbnDiff(EMPTY_ISBN_CURRENT, EMPTY_ISBN_SOURCE, "ISBN metadata").groups).toEqual([]);
  });

  it("stages title/description and adds an immediate cover row", () => {
    const rows = buildBookmarkIsbnDiff(EMPTY_ISBN_CURRENT, {
      title: "Project Hail Mary",
      description: "A lone astronaut must save the earth from disaster.",
      coverUrl: "https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg",
    }, "ISBN metadata").groups[0].rows;
    expect(rows.map(r => r.key)).toEqual(["isbnTitle", "isbnDescription", "isbn-cover"]);
    expect(rows.find(r => r.key === "isbnTitle")?.payload).toEqual({
      kind: "field",
      field: "title",
      value: "Project Hail Mary",
    });
    const cover = rows.find(r => r.key === "isbn-cover");
    expect(cover?.applyImmediately).toBe(true);
    expect(cover?.defaultChecked).toBe(true);
  });
});
