// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildIsbnLinks } from "./isbnLinks";

describe("buildIsbnLinks", () => {
  it("returns an empty array for blank or whitespace-only input", () => {
    expect(buildIsbnLinks("")).toEqual([]);
    expect(buildIsbnLinks("   ")).toEqual([]);
  });

  it("builds one link per retailer/catalog, deriving ISBN-10 for Amazon", () => {
    const links = buildIsbnLinks("  9780131103627 ");
    expect(links.map(l => l.label)).toEqual([
      "Amazon (US)",
      "Amazon (Japan)",
      "Open Library",
      "WorldCat",
      "Goodreads",
    ]);
    const byLabel = Object.fromEntries(links.map(l => [l.label, l.url]));
    expect(byLabel["Amazon (US)"]).toBe("https://www.amazon.com/dp/0131103628");
    expect(byLabel["Amazon (Japan)"]).toBe("https://www.amazon.co.jp/dp/0131103628");
    expect(byLabel["Open Library"]).toBe("https://openlibrary.org/isbn/9780131103627");
    expect(byLabel["Goodreads"]).toBe("https://www.goodreads.com/book/isbn/9780131103627");
  });

  it("embeds a short/non-ISBN-13-length value in each provider's URL shape unchanged", () => {
    const byLabel = Object.fromEntries(buildIsbnLinks("123").map(l => [l.label, l.url]));
    expect(byLabel["Amazon (US)"]).toBe("https://www.amazon.com/dp/123");
    expect(byLabel["Open Library"]).toBe("https://openlibrary.org/isbn/123");
    expect(byLabel["Goodreads"]).toBe("https://www.goodreads.com/book/isbn/123");
  });

  it("omits the Amazon links for a 979-prefixed ISBN-13 (no ISBN-10 form)", () => {
    const links = buildIsbnLinks("9791234567896");
    expect(links.map(l => l.label)).toEqual(["Open Library", "WorldCat", "Goodreads"]);
  });
});
