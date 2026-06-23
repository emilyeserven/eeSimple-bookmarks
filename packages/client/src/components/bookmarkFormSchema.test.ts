import { describe, expect, it } from "vitest";

import { buildBookmarkDefaultValues } from "./bookmarkFormSchema";
import { makeBookmark } from "../test-utils/factories";

describe("buildBookmarkDefaultValues", () => {
  it("seeds url/title from initial values in create mode", () => {
    const values = buildBookmarkDefaultValues(undefined, undefined, {
      url: "https://example.com",
      title: "Example",
    });
    expect(values.url).toBe("https://example.com");
    expect(values.title).toBe("Example");
  });

  it("defaults to empty strings when no initial values are given", () => {
    const values = buildBookmarkDefaultValues(undefined, undefined);
    expect(values.url).toBe("");
    expect(values.title).toBe("");
  });

  it("ignores initial values in edit mode (existing bookmark wins)", () => {
    const bookmark = makeBookmark({
      url: "https://saved.example.com",
      originalUrl: null,
      title: "Saved title",
    });
    const values = buildBookmarkDefaultValues(bookmark, undefined, {
      url: "https://other.example.com",
      title: "Other",
    });
    expect(values.url).toBe("https://saved.example.com");
    expect(values.title).toBe("Saved title");
  });
});
