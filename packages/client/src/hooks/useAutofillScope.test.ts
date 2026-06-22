import { describe, expect, it } from "vitest";

import { resolveAutofillScope } from "./useAutofillScope";

const data = {
  categories: [{
    id: "cat-1",
    slug: "recipes",
    name: "Recipes",
  }],
  properties: [{
    id: "prop-1",
    slug: "rating",
    name: "Rating",
  }],
  websites: [{
    id: "web-1",
    slug: "youtube",
    siteName: "YouTube",
  }],
  mediaTypes: [{
    id: "mt-1",
    slug: "video",
    name: "Video",
  }],
  tag: {
    id: "tag-1",
    name: "Cooking",
  },
  channel: {
    id: "ch-1",
    name: "Chef Jane",
  },
};

describe("resolveAutofillScope", () => {
  it("is inactive with no scope or no slug", () => {
    expect(resolveAutofillScope(undefined, undefined, data)).toEqual({
      active: false,
      label: undefined,
      listProps: {},
    });
    expect(resolveAutofillScope("category", undefined, data)).toEqual({
      active: false,
      label: undefined,
      listProps: {},
    });
  });

  it("maps each scope kind to its list prop + label", () => {
    expect(resolveAutofillScope("category", "recipes", data)).toEqual({
      active: true,
      label: "Recipes",
      listProps: {
        categoryId: "cat-1",
      },
    });
    expect(resolveAutofillScope("property", "rating", data)).toEqual({
      active: true,
      label: "Rating",
      listProps: {
        propertyId: "prop-1",
      },
    });
    expect(resolveAutofillScope("website", "youtube", data)).toEqual({
      active: true,
      label: "YouTube",
      listProps: {
        websiteId: "web-1",
      },
    });
    expect(resolveAutofillScope("media-type", "video", data)).toEqual({
      active: true,
      label: "Video",
      listProps: {
        mediaTypeId: "mt-1",
      },
    });
    expect(resolveAutofillScope("tag", "cooking", data)).toEqual({
      active: true,
      label: "Cooking",
      listProps: {
        tagId: "tag-1",
      },
    });
    expect(resolveAutofillScope("channel", "chef-jane", data)).toEqual({
      active: true,
      label: "Chef Jane",
      listProps: {
        channelId: "ch-1",
      },
    });
  });

  it("stays active but unresolved when the entity isn't found (e.g. still loading)", () => {
    expect(resolveAutofillScope("category", "missing", {
      ...data,
      categories: [],
    })).toEqual({
      active: true,
      label: undefined,
      listProps: {
        categoryId: undefined,
      },
    });
  });
});
