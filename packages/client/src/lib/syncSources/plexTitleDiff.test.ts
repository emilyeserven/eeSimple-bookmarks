// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildPlexTitleDiff, type PlexTitleDiffCurrent, type PlexTitleDiffSource } from "./plexTitleDiff";

const EMPTY_CURRENT: PlexTitleDiffCurrent = {
  name: null,
  englishName: null,
  wikipediaLinkEn: null,
  wikipediaLinkLocal: null,
  imageUrl: null,
};

const EMPTY_SOURCE: PlexTitleDiffSource = {
  name: null,
  englishName: null,
  wikipediaLinkEn: null,
  wikipediaLinkLocal: null,
  posterUrl: null,
};

describe("buildPlexTitleDiff", () => {
  it("returns an empty diff when the source offers nothing", () => {
    expect(buildPlexTitleDiff(EMPTY_CURRENT, EMPTY_SOURCE, "Plex").groups).toEqual([]);
  });

  it("offers native name + wiki links (checked, fill-empty) when current is empty; englishName carries no row", () => {
    const source: PlexTitleDiffSource = {
      name: "기생충",
      englishName: "Parasite",
      wikipediaLinkEn: "https://en.wikipedia.org/wiki/Parasite_(2019_film)",
      wikipediaLinkLocal: "https://ko.wikipedia.org/wiki/기생충_(영화)",
      posterUrl: null,
    };
    const diff = buildPlexTitleDiff(EMPTY_CURRENT, source, "Plex");
    const rows = diff.groups[0].rows;
    expect(diff.groups[0].source).toBe("Plex");
    // englishName has no scalar to stage into for these entities, so it never produces a row.
    expect(rows.map(row => row.key)).toEqual([
      "name",
      "wikipediaLinkEn",
      "wikipediaLinkLocal",
    ]);
    expect(rows.every(row => row.kind === "text" && row.defaultChecked)).toBe(true);
    expect(rows[0].payload).toEqual({
      field: "name",
      value: "기생충",
    });
  });

  it("skips fields that already match and offers differing ones unchecked (would-overwrite)", () => {
    const current: PlexTitleDiffCurrent = {
      ...EMPTY_CURRENT,
      name: "Parasite",
      englishName: "Parasite",
    };
    const source: PlexTitleDiffSource = {
      ...EMPTY_SOURCE,
      name: "기생충",
      englishName: "Parasite",
    };
    const rows = buildPlexTitleDiff(current, source, "Plex").groups[0].rows;
    // name differs → one unchecked row (englishName never produces a row at all).
    expect(rows.map(row => row.key)).toEqual(["name"]);
    expect(rows[0].defaultChecked).toBe(false);
  });

  it("adds an immediate poster image row when a poster URL is present", () => {
    const source: PlexTitleDiffSource = {
      ...EMPTY_SOURCE,
      posterUrl: "/api/plex/poster?ratingKey=42",
    };
    const rows = buildPlexTitleDiff({
      ...EMPTY_CURRENT,
      imageUrl: "https://img/current.webp",
    }, source, "Plex").groups[0].rows;
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe("poster");
    expect(rows[0].kind).toBe("image");
    expect(rows[0].applyImmediately).toBe(true);
    expect(rows[0].currentThumb).toBe("https://img/current.webp");
    expect(rows[0].nextThumb).toBe("/api/plex/poster?ratingKey=42");
    // current image present → default unchecked (would overwrite).
    expect(rows[0].defaultChecked).toBe(false);
  });
});
