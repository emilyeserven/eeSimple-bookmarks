import { describe, expect, it } from "vitest";

import { resolveAutofillFacets } from "./useAutofillScope";

const data = {
  categories: [{
    id: "cat-1",
    slug: "recipes",
  }],
  properties: [{
    id: "prop-1",
    slug: "rating",
  }],
  websites: [{
    id: "web-1",
    slug: "youtube",
  }],
  mediaTypes: [{
    id: "mt-1",
    slug: "video",
  }],
  tags: [{
    id: "tag-1",
    slug: "cooking",
  }],
  channels: [{
    id: "ch-1",
    slug: "chef-jane",
  }],
};

describe("resolveAutofillFacets", () => {
  it("is empty with no facets", () => {
    expect(resolveAutofillFacets({}, data)).toEqual({
      listProps: {},
      noCategory: false,
    });
  });

  it("maps each facet slug to its list prop", () => {
    expect(resolveAutofillFacets({
      category: "recipes",
    }, data)).toEqual({
      listProps: {
        categoryId: "cat-1",
      },
      noCategory: false,
    });
    expect(resolveAutofillFacets({
      property: "rating",
    }, data)).toEqual({
      listProps: {
        propertyId: "prop-1",
      },
      noCategory: false,
    });
    expect(resolveAutofillFacets({
      website: "youtube",
    }, data)).toEqual({
      listProps: {
        websiteId: "web-1",
      },
      noCategory: false,
    });
    expect(resolveAutofillFacets({
      mediaType: "video",
    }, data)).toEqual({
      listProps: {
        mediaTypeId: "mt-1",
      },
      noCategory: false,
    });
    expect(resolveAutofillFacets({
      tag: "cooking",
    }, data)).toEqual({
      listProps: {
        tagId: "tag-1",
      },
      noCategory: false,
    });
    expect(resolveAutofillFacets({
      channel: "chef-jane",
    }, data)).toEqual({
      listProps: {
        channelId: "ch-1",
      },
      noCategory: false,
    });
  });

  it("combines multiple facets (AND)", () => {
    expect(resolveAutofillFacets({
      category: "recipes",
      tag: "cooking",
      website: "youtube",
    }, data)).toEqual({
      listProps: {
        categoryId: "cat-1",
        tagId: "tag-1",
        websiteId: "web-1",
      },
      noCategory: false,
    });
  });

  it("treats the 'none' category sentinel as the no-category flag", () => {
    expect(resolveAutofillFacets({
      category: "none",
    }, data)).toEqual({
      listProps: {},
      noCategory: true,
    });
  });

  it("contributes no filter for an unresolved slug (e.g. still loading)", () => {
    expect(resolveAutofillFacets({
      category: "missing",
    }, data)).toEqual({
      listProps: {},
      noCategory: false,
    });
  });
});
