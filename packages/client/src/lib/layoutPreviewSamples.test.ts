// @vitest-environment node
import type { Bookmark, Category, LayoutableEntityKind } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildSampleEntity, SAMPLE_ID } from "./layoutPreviewSamples";

/**
 * The Page Layouts preview (#1225) offers a synthetic "everything filled in" sample per kind. These
 * pure assertions guard that the builder yields a filled entity (so every placeable field has content
 * to render) for the factory-backed kinds and `null` for the two config entities we render from real
 * instances instead.
 */
describe("buildSampleEntity", () => {
  it("fills the sample bookmark with content, keyed by the sample sentinel", () => {
    const bookmark = buildSampleEntity("bookmark") as Bookmark;
    expect(bookmark.id).toBe(SAMPLE_ID);
    expect(bookmark.description).toBeTruthy();
    expect(bookmark.image).not.toBeNull();
    expect(bookmark.tags.length).toBeGreaterThan(0);
  });

  it("fills a taxonomy sample with a name + description", () => {
    const category = buildSampleEntity("category") as Category;
    expect(category.id).toBe(SAMPLE_ID);
    expect(category.name).toBeTruthy();
    expect(category.description).toBeTruthy();
  });

  it("returns null for the config entities previewed from real instances", () => {
    expect(buildSampleEntity("autofill")).toBeNull();
    expect(buildSampleEntity("card-display-rule")).toBeNull();
  });

  it("returns either a filled entity or null for every layout kind", () => {
    const kinds: LayoutableEntityKind[] = [
      "bookmark",
      "category",
      "newsletter",
      "group",
      "custom-property",
      "genre-mood",
      "tag",
      "website",
      "media-type",
      "location",
      "youtube-channel",
      "person",
      "autofill",
      "card-display-rule",
    ];
    for (const kind of kinds) {
      const sample = buildSampleEntity(kind);
      if (sample !== null) expect(sample.id).toBe(SAMPLE_ID);
    }
  });
});
