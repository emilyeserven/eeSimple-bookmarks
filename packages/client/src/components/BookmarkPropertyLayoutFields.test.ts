import { describe, expect, it } from "vitest";

import { bookmarkPropertyEditEligible } from "./BookmarkPropertyLayoutFields";
import { DATE_POSTED_SLUG, RUNTIME_SLUG } from "./bookmarkFormSchema";
import { makeBookmark, makeCustomProperty } from "../test-utils/factories";

/**
 * The per-property EDIT visibility gate — the scope + form-flag + YouTube-built-in short-circuit that
 * decides whether a custom property's edit field renders on a given bookmark (the layout-driven
 * replacement for `selectVisibleFormProperties(placement:"all")` + `builtInHiddenSlugs`).
 */
describe("bookmarkPropertyEditEligible", () => {
  it("shows an enabled, in-scope property scoped to the bookmark's category", () => {
    const property = makeCustomProperty({
      allCategories: false,
      categoryIds: ["cat-1"],
    });
    const bookmark = makeBookmark({
      categoryId: "cat-1",
    });
    expect(bookmarkPropertyEditEligible(property, bookmark)).toBe(true);
  });

  it("hides a property scoped to a different category", () => {
    const property = makeCustomProperty({
      allCategories: false,
      categoryIds: ["cat-2"],
    });
    const bookmark = makeBookmark({
      categoryId: "cat-1",
    });
    expect(bookmarkPropertyEditEligible(property, bookmark)).toBe(false);
  });

  it("hides a disabled or form-hidden property", () => {
    const bookmark = makeBookmark({
      categoryId: "cat-1",
    });
    expect(bookmarkPropertyEditEligible(makeCustomProperty({
      enabled: false,
    }), bookmark)).toBe(false);
    expect(bookmarkPropertyEditEligible(makeCustomProperty({
      hiddenFromForm: true,
    }), bookmark)).toBe(false);
  });

  it("hides the built-in Runtime/Date Posted on a YouTube bookmark (edited via the YouTube field)", () => {
    const youtube = makeBookmark({
      url: "https://www.youtube.com/watch?v=abc",
    });
    expect(bookmarkPropertyEditEligible(makeCustomProperty({
      slug: RUNTIME_SLUG,
    }), youtube)).toBe(false);
    expect(bookmarkPropertyEditEligible(makeCustomProperty({
      slug: DATE_POSTED_SLUG,
    }), youtube)).toBe(false);
  });

  it("shows Runtime/Date Posted as ordinary fields on a non-YouTube bookmark", () => {
    const other = makeBookmark({
      url: "https://example.com/article",
    });
    expect(bookmarkPropertyEditEligible(makeCustomProperty({
      slug: RUNTIME_SLUG,
    }), other)).toBe(true);
  });
});
