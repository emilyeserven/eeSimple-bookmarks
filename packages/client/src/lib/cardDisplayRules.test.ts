// @vitest-environment node
import type { Bookmark, CardDisplayConfig, CardDisplaySection, ConditionTree, EvaluateOptions } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { emptyCardImageCorners } from "@eesimple/types";

import { cardSectionVisible, resolveCardDisplay } from "./cardDisplayRules";
import { makeBookmark } from "../test-utils/factories";

const options: EvaluateOptions = {};

function bookmark(overrides: Partial<Bookmark> = {}): Bookmark {
  return makeBookmark({
    id: "b1",
    ...overrides,
  });
}

const videoOnly: ConditionTree = {
  type: "group",
  combinator: "and",
  children: [{
    type: "media-type",
    mediaTypeIds: ["mt-video"],
  }],
};

function section(key: string, visibleIf?: ConditionTree): CardDisplaySection {
  return {
    key,
    form: "inline",
    layout: {
      mode: "flex",
    },
    fields: [{
      key: "title",
    }],
    visibleIf,
  };
}

function config(sections: CardDisplaySection[]): CardDisplayConfig {
  return {
    sections,
    imageCorners: emptyCardImageCorners(),
    imageMode: "natural",
    imageVisibility: "shown",
    imageLayout: "above",
    hideWebsiteForYouTube: false,
  };
}

const videoBookmark = bookmark({
  mediaType: {
    id: "mt-video",
    name: "Video",
    slug: "video",
  } as Bookmark["mediaType"],
});

describe("cardSectionVisible", () => {
  const input = {
    url: "",
    title: "",
  } as never; // unused for the empty-tree short-circuit path

  it("shows a section with no visibleIf", () => {
    expect(cardSectionVisible(section("s"), input, options)).toBe(true);
  });

  it("shows a section whose visibleIf is an empty group", () => {
    const empty: ConditionTree = {
      type: "group",
      combinator: "and",
      children: [],
    };
    expect(cardSectionVisible(section("s", empty), input, options)).toBe(true);
  });
});

describe("resolveCardDisplay", () => {
  it("keeps unconditional sections and drops non-matching conditional sections", () => {
    const resolved = resolveCardDisplay(
      bookmark(),
      config([section("always"), section("videos", videoOnly)]),
      options,
    );
    expect(resolved.sections.map(s => s.key)).toEqual(["always"]);
  });

  it("keeps a conditional section for a matching bookmark", () => {
    const resolved = resolveCardDisplay(
      videoBookmark,
      config([section("always"), section("videos", videoOnly)]),
      options,
    );
    expect(resolved.sections.map(s => s.key)).toEqual(["always", "videos"]);
  });

  it("passes through the image presentation attributes", () => {
    const resolved = resolveCardDisplay(bookmark(), {
      ...config([]),
      imageMode: "square",
      hideWebsiteForYouTube: true,
    }, options);
    expect(resolved.imageMode).toBe("square");
    expect(resolved.hideWebsiteForYouTube).toBe(true);
  });
});
