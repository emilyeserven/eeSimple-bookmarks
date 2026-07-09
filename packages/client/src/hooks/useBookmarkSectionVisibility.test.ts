// @vitest-environment node
import type { Bookmark, ConditionTree, EvaluateOptions, LayoutSection } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { sectionMatchesConditionInput } from "./useBookmarkSectionVisibility";
import { bookmarkToConditionInput } from "../lib/cardDisplayRules";
import { makeBookmark } from "../test-utils/factories";

// No resolvers needed for these assertions (no cascade); an empty options object suffices.
const options: EvaluateOptions = {};

function section(visibleIf?: ConditionTree): LayoutSection {
  return {
    key: "s",
    fields: ["name"],
    visibleIf,
  };
}

function inputFor(overrides: Partial<Bookmark> = {}) {
  return bookmarkToConditionInput(makeBookmark({
    id: "b1",
    ...overrides,
  }));
}

const videoOnly: ConditionTree = {
  type: "group",
  combinator: "and",
  children: [{
    type: "media-type",
    mediaTypeIds: ["mt-video"],
  }],
};

describe("sectionMatchesConditionInput", () => {
  it("shows a section with no visibleIf", () => {
    expect(sectionMatchesConditionInput(section(), inputFor(), options)).toBe(true);
  });

  it("shows a section whose visibleIf is an empty group (matches nothing on its own, but means always-visible here)", () => {
    const empty: ConditionTree = {
      type: "group",
      combinator: "and",
      children: [],
    };
    expect(sectionMatchesConditionInput(section(empty), inputFor(), options)).toBe(true);
  });

  it("shows a section only for a bookmark that matches its condition", () => {
    const matching = inputFor({
      mediaType: {
        id: "mt-video",
        name: "Video",
        slug: "video",
      } as Bookmark["mediaType"],
    });
    expect(sectionMatchesConditionInput(section(videoOnly), matching, options)).toBe(true);
  });

  it("hides a section for a bookmark that does not match its condition", () => {
    expect(sectionMatchesConditionInput(section(videoOnly), inputFor(), options)).toBe(false);
  });
});
