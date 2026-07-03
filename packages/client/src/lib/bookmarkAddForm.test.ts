// @vitest-environment node
import type { BookmarkAddFormSettings } from "@eesimple/types";

import {
  BOOKMARK_FORM_DETAIL_SLUGS,
  DATE_POSTED_SLUG,
  DEFAULT_BOOKMARK_ADD_FORM_SETTINGS,
  RUNTIME_SLUG,
} from "@eesimple/types";
import { describe, expect, it } from "vitest";

import { resolveBookmarkAddForm } from "./bookmarkAddForm";

describe("resolveBookmarkAddForm", () => {
  describe("edit mode", () => {
    it("always returns today's hardcoded split, ignoring the passed-in settings", () => {
      const settings: BookmarkAddFormSettings = {
        advancedFields: ["title"],
        hiddenFields: ["romanizedTitle", "categoryId", "mediaTypeId", "languageId", "groupId", "descriptionTags", "personIds", "image"],
        builtInPropertyPlacements: {
          [RUNTIME_SLUG]: "default",
        },
      };

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

    it("ignores default settings too — same literals regardless of input", () => {
      const resolved = resolveBookmarkAddForm(DEFAULT_BOOKMARK_ADD_FORM_SETTINGS, true);

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
    });
  });

  describe("create mode", () => {
    it("buckets standard fields by settings membership, preserving tuple order", () => {
      const settings: BookmarkAddFormSettings = {
        advancedFields: ["image", "categoryId"],
        hiddenFields: ["personIds"],
        builtInPropertyPlacements: {},
      };

      const resolved = resolveBookmarkAddForm(settings, false);

      // Tuple order: title, romanizedTitle, categoryId, mediaTypeId, languageId, groupId,
      // descriptionTags, personIds, image
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

    it("omits hidden fields entirely from both buckets", () => {
      const settings: BookmarkAddFormSettings = {
        advancedFields: [],
        hiddenFields: ["title", "image"],
        builtInPropertyPlacements: {},
      };

      const resolved = resolveBookmarkAddForm(settings, false);

      expect(resolved.mainStandardFields).not.toContain("title");
      expect(resolved.mainStandardFields).not.toContain("image");
      expect(resolved.advancedStandardFields).not.toContain("title");
      expect(resolved.advancedStandardFields).not.toContain("image");
    });

    it("ignores unknown field keys without crashing", () => {
      const settings: BookmarkAddFormSettings = {
        advancedFields: ["notARealField"],
        hiddenFields: ["alsoNotReal"],
        builtInPropertyPlacements: {},
      };

      expect(() => resolveBookmarkAddForm(settings, false)).not.toThrow();
      const resolved = resolveBookmarkAddForm(settings, false);
      // Every standard field still appears exactly once across the two buckets.
      const all = [...resolved.mainStandardFields, ...resolved.advancedStandardFields];
      expect(all).toHaveLength(9);
    });

    it("merges builtInPropertyPlacements over the defaults", () => {
      const settings: BookmarkAddFormSettings = {
        advancedFields: [],
        hiddenFields: [],
        builtInPropertyPlacements: {
          [RUNTIME_SLUG]: "default",
          "some-future-slug": "advanced",
        },
      };

      const resolved = resolveBookmarkAddForm(settings, false);

      // Overridden slug takes the settings value.
      expect(resolved.placementOverrides?.[RUNTIME_SLUG]).toBe("default");
      // A slug not touched by settings keeps the shipped default (hidden).
      expect(resolved.placementOverrides?.[DATE_POSTED_SLUG]).toBe("hidden");
      // A slug only present in settings still appears.
      expect(resolved.placementOverrides?.["some-future-slug"]).toBe("advanced");
    });

    it("defaults to the shipped built-in placements when settings has none set", () => {
      const settings: BookmarkAddFormSettings = {
        advancedFields: [],
        hiddenFields: [],
        builtInPropertyPlacements: {},
      };

      const resolved = resolveBookmarkAddForm(settings, false);

      for (const slug of BOOKMARK_FORM_DETAIL_SLUGS) {
        expect(resolved.placementOverrides?.[slug]).toBe("hidden");
      }
    });
  });
});
