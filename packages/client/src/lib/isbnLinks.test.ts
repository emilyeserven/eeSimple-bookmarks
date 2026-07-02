// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildIsbnLinks } from "./isbnLinks";

describe("buildIsbnLinks", () => {
  it("returns an empty array for blank or whitespace-only input", () => {
    expect(buildIsbnLinks("")).toEqual([]);
    expect(buildIsbnLinks("   ")).toEqual([]);
  });

  it("builds one link per retailer/catalog, trimming the ISBN", () => {
    const links = buildIsbnLinks("  9780131103627 ");
    expect(links.map(l => l.label)).toEqual([
      "Amazon (US)",
      "Amazon (Japan)",
      "Open Library",
      "WorldCat",
      "Goodreads",
    ]);
    expect(links.every(l => l.url.endsWith("9780131103627"))).toBe(true);
  });

  it("embeds the ISBN in each provider's URL shape", () => {
    const byLabel = Object.fromEntries(buildIsbnLinks("123").map(l => [l.label, l.url]));
    expect(byLabel["Amazon (US)"]).toBe("https://www.amazon.com/dp/123");
    expect(byLabel["Open Library"]).toBe("https://openlibrary.org/isbn/123");
    expect(byLabel["Goodreads"]).toBe("https://www.goodreads.com/book/isbn/123");
  });
});
