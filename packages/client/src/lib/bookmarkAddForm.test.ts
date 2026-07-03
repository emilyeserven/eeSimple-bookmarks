// @vitest-environment node
import type { BookmarkAddFormPlacement, BookmarkAddFormSettings } from "@eesimple/types";

import {
  BOOKMARK_FORM_DETAIL_SLUGS,
  DATE_POSTED_SLUG,
  DEFAULT_BOOKMARK_ADD_FORM_SETTINGS,
  RUNTIME_SLUG,
} from "@eesimple/types";
import { describe, expect, it } from "vitest";

import { resolveBookmarkAddForm } from "./bookmarkAddForm";

/** Build a settings object from a partial standard-placement map (merged over the defaults). */
function settingsWith(
  standardFieldPlacements: Record<string, BookmarkAddFormPlacement>,
  builtInPropertyPlacements: Record<string, BookmarkAddFormPlacement> = {},
): BookmarkAddFormSettings {
  return {
    standardFieldPlacements: {
      ...DEFAULT_BOOKMARK_ADD_FORM_SETTINGS.standardFieldPlacements,
      ...standardFieldPlacements,
    },
    builtInPropertyPlacements,
  };
}

describe("resolveBookmarkAddForm", () => {
  describe("edit mode", () => {
    it("always returns today's hardcoded split, ignoring the passed-in settings", () => {
      const settings = settingsWith(
        // Deliberately scramble the placements — edit mode must ignore them.
        {
          title: "advanced",
          romanizedTitle: "hidden",
          categoryId: "hidden",
        },
        {
          [RUNTIME_SLUG]: "default",
        },
      );

      const resolved = resolveBookmarkAddForm(settings, true);

      expect(resolved.mainStandardFields).toEqual(["title", "romanizedTitle"]);
      expect(resolved.advancedStandardFields).toEqual([
        "categoryId",
        "mediaTypeId",
        "languageId",
        "groupId",
        "descriptionTags",
        "personIds",
        "image",
      ]);
      expect(resolved.mainHiddenSlugs).toEqual([...BOOKMARK_FORM_DETAIL_SLUGS]);
      expect(resolved.advancedHiddenSlugs).toEqual([RUNTIME_SLUG, DATE_POSTED_SLUG]);
      expect(resolved.placementOverrides).toBeUndefined();
    });

    it("excludes the newer hidden-by-default fields (edit surfaces are unchanged)", () => {
      const resolved = resolveBookmarkAddForm(DEFAULT_BOOKMARK_ADD_FORM_SETTINGS, true);

      const all = [...resolved.mainStandardFields, ...resolved.advancedStandardFields];
      for (const field of ["groupIds", "genreMoodIds", "locationIds", "mediaLink", "blacklistedTagIds", "blacklistedLocationIds"]) {
        expect(all).not.toContain(field);
      }
    });
  });

  describe("create mode", () => {
    it("buckets standard fields by resolved placement, preserving tuple order", () => {
      const settings = settingsWith({
        categoryId: "advanced",
        mediaTypeId: "default",
        languageId: "default",
        groupId: "default",
        descriptionTags: "default",
        personIds: "hidden",
        image: "advanced",
      });

      const resolved = resolveBookmarkAddForm(settings, false);

      expect(resolved.mainStandardFields).toEqual([
        "title",
        "romanizedTitle",
        "mediaTypeId",
        "languageId",
        "groupId",
        "descriptionTags",
      ]);
      expect(resolved.advancedStandardFields).toEqual(["categoryId", "image"]);
      expect(resolved.mainHiddenSlugs).toEqual([]);
      expect(resolved.advancedHiddenSlugs).toEqual([]);
    });

    it("defaults the newer taxonomy/media/location fields to hidden", () => {
      const resolved = resolveBookmarkAddForm(DEFAULT_BOOKMARK_ADD_FORM_SETTINGS, false);

      const all = [...resolved.mainStandardFields, ...resolved.advancedStandardFields];
      for (const field of ["groupIds", "genreMoodIds", "locationIds", "mediaLink", "blacklistedTagIds", "blacklistedLocationIds"]) {
        expect(all).not.toContain(field);
      }
    });

    it("shows a newer field once it is explicitly placed", () => {
      const resolved = resolveBookmarkAddForm(settingsWith({
        locationIds: "advanced",
        groupIds: "default",
      }), false);

      expect(resolved.mainStandardFields).toContain("groupIds");
      expect(resolved.advancedStandardFields).toContain("locationIds");
    });

    it("omits hidden fields entirely from both buckets", () => {
      const settings = settingsWith({
        title: "hidden",
        image: "hidden",
      });

      const resolved = resolveBookmarkAddForm(settings, false);

      expect(resolved.mainStandardFields).not.toContain("title");
      expect(resolved.mainStandardFields).not.toContain("image");
      expect(resolved.advancedStandardFields).not.toContain("title");
      expect(resolved.advancedStandardFields).not.toContain("image");
    });

    it("merges builtInPropertyPlacements over the defaults", () => {
      const settings = settingsWith({}, {
        [RUNTIME_SLUG]: "default",
        "some-future-slug": "advanced",
      });

      const resolved = resolveBookmarkAddForm(settings, false);

      expect(resolved.placementOverrides?.[RUNTIME_SLUG]).toBe("default");
      expect(resolved.placementOverrides?.[DATE_POSTED_SLUG]).toBe("hidden");
      expect(resolved.placementOverrides?.["some-future-slug"]).toBe("advanced");
    });

    it("defaults to the shipped built-in placements when settings has none set", () => {
      const resolved = resolveBookmarkAddForm(settingsWith({}), false);

      for (const slug of BOOKMARK_FORM_DETAIL_SLUGS) {
        expect(resolved.placementOverrides?.[slug]).toBe("hidden");
      }
    });
  });
});
