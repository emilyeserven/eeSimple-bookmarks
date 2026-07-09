// @vitest-environment node
import type { Bookmark, ConditionTree, LayoutSection } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { buildTagDescendants } from "@eesimple/types";

import { sectionMatchesConditionInput } from "./useBookmarkSectionVisibility";
import { bookmarkToConditionInput } from "../lib/cardDisplayRules";
import { makeBookmark } from "../test-utils/factories";

const tagDescendants = buildTagDescendants([]);

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
    expect(sectionMatchesConditionInput(section(), inputFor(), tagDescendants)).toBe(true);
  });

  it("shows a section whose visibleIf is an empty group (matches nothing on its own, but means always-visible here)", () => {
    const empty: ConditionTree = {
      type: "group",
      combinator: "and",
      children: [],
    };
    expect(sectionMatchesConditionInput(section(empty), inputFor(), tagDescendants)).toBe(true);
  });

  it("shows a section only for a bookmark that matches its condition", () => {
    const matching = inputFor({
      mediaType: {
        id: "mt-video",
        name: "Video",
        slug: "video",
      } as Bookmark["mediaType"],
    });
    expect(sectionMatchesConditionInput(section(videoOnly), matching, tagDescendants)).toBe(true);
  });

  it("hides a section for a bookmark that does not match its condition", () => {
    expect(sectionMatchesConditionInput(section(videoOnly), inputFor(), tagDescendants)).toBe(false);
  });
});
