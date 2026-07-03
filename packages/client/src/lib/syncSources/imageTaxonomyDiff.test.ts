// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildImageTaxonomyDiff } from "./imageTaxonomyDiff";

describe("buildImageTaxonomyDiff", () => {
  it("returns an empty diff when the source has no image to offer", () => {
    expect(buildImageTaxonomyDiff("current.jpg", null, "YouTube").groups).toEqual([]);
  });

  it("offers one image row (checked) when the entity has no current image", () => {
    const diff = buildImageTaxonomyDiff(null, "https://img/new.jpg", "YouTube");
    const rows = diff.groups[0].rows;
    expect(diff.groups[0].source).toBe("YouTube");
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe("image");
    expect(rows[0].currentThumb).toBeNull();
    expect(rows[0].nextThumb).toBe("https://img/new.jpg");
    expect(rows[0].applyImmediately).toBe(true);
    expect(rows[0].defaultChecked).toBe(true);
  });

  it("offers the row unchecked (would-overwrite) when the entity already has an image", () => {
    const diff = buildImageTaxonomyDiff("https://img/current.jpg", "https://img/new.jpg", "Plex");
    expect(diff.groups[0].rows[0].defaultChecked).toBe(false);
    expect(diff.groups[0].rows[0].currentThumb).toBe("https://img/current.jpg");
  });
});
