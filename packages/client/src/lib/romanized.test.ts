import { describe, expect, it } from "vitest";

import { orderRomanized, romanizedSortKey } from "./romanized";

describe("orderRomanized", () => {
  it("returns just the name when there is no romanized value", () => {
    expect(orderRomanized("東京", null, false)).toEqual({
      primary: "東京",
      secondary: null,
    });
    expect(orderRomanized("東京", undefined, true)).toEqual({
      primary: "東京",
      secondary: null,
    });
    expect(orderRomanized("東京", "   ", true)).toEqual({
      primary: "東京",
      secondary: null,
    });
  });

  it("keeps the name primary with romanized de-emphasized when not showing romanized first", () => {
    expect(orderRomanized("東京", "Tokyo", false)).toEqual({
      primary: "東京",
      secondary: "Tokyo",
    });
  });

  it("swaps to romanized primary when showing romanized first", () => {
    expect(orderRomanized("東京", "Tokyo", true)).toEqual({
      primary: "Tokyo",
      secondary: "東京",
    });
  });

  it("trims the romanized value before using it", () => {
    expect(orderRomanized("東京", "  Tokyo  ", false)).toEqual({
      primary: "東京",
      secondary: "Tokyo",
    });
  });
});

describe("romanizedSortKey", () => {
  it("sorts by romanized when enabled and present", () => {
    expect(romanizedSortKey("東京", "Tokyo", true)).toBe("Tokyo");
  });

  it("falls back to the name when romanized is empty even if enabled", () => {
    expect(romanizedSortKey("東京", null, true)).toBe("東京");
    expect(romanizedSortKey("東京", "  ", true)).toBe("東京");
  });

  it("uses the name when sorting by romanized is disabled", () => {
    expect(romanizedSortKey("東京", "Tokyo", false)).toBe("東京");
  });
});
