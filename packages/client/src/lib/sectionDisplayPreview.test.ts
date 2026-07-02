// @vitest-environment node
import { describe, expect, it } from "vitest";

import { sectionDisplayPreview } from "./sectionDisplayPreview";

/** Base "cards" display value; tests override the parts they care about. */
const base = {
  viewMode: "cards" as const,
  columns: 2,
  imageMode: "natural",
  imageVisibility: "shown" as const,
  imageLayout: "above" as const,
};

describe("sectionDisplayPreview", () => {
  it("summarizes a table view as just 'Table'", () => {
    expect(sectionDisplayPreview({
      ...base,
      viewMode: "table",
    })).toBe("Table");
  });

  it("renders singular vs plural column counts", () => {
    expect(sectionDisplayPreview({
      ...base,
      columns: 1,
      imageVisibility: "off",
    })).toBe("1 column · No image");
    expect(sectionDisplayPreview({
      ...base,
      columns: 3,
      imageVisibility: "off",
    })).toBe("3 columns · No image");
  });

  it("labels the image mode when the image is shown", () => {
    expect(sectionDisplayPreview({
      ...base,
      columns: 3,
      imageMode: "cropped",
      imageVisibility: "shown",
    })).toBe("3 columns · Cropped");
  });

  it("shows 'Image only' for the image-only visibility", () => {
    expect(sectionDisplayPreview({
      ...base,
      columns: 3,
      imageVisibility: "image-only",
    })).toBe("3 columns · Image only");
  });

  it("adds the Side/Above layout only at 1 or 2 columns when shown", () => {
    expect(sectionDisplayPreview({
      ...base,
      columns: 2,
      imageMode: "natural",
      imageVisibility: "shown",
      imageLayout: "side",
    })).toBe("2 columns · Natural · Side");
    expect(sectionDisplayPreview({
      ...base,
      columns: 1,
      imageVisibility: "shown",
      imageLayout: "above",
    })).toBe("1 column · Natural · Above");
    // No layout segment at 3 columns.
    expect(sectionDisplayPreview({
      ...base,
      columns: 3,
      imageVisibility: "shown",
      imageLayout: "side",
    })).toBe("3 columns · Natural");
  });

  it("appends 'Hidden when empty' when requested", () => {
    expect(sectionDisplayPreview({
      ...base,
      columns: 1,
      imageVisibility: "off",
    }, true)).toBe("1 column · No image · Hidden when empty");
  });
});
