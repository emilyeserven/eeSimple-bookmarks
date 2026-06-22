import { describe, expect, it } from "vitest";

import { resolveAutofillScopeDefaults } from "./autofillPrefill";

const lookups = {
  categories: [{
    slug: "recipes",
    id: "cat-1",
  }],
  properties: [{
    slug: "rating",
    id: "prop-1",
  }],
  websites: [{
    slug: "youtube",
    domain: "youtube.com",
  }],
  mediaTypes: [{
    slug: "video",
    id: "mt-1",
  }],
  tagId: "tag-1",
  channelId: "chan-1",
};

describe("resolveAutofillScopeDefaults", () => {
  it("returns all-undefined for empty slugs", () => {
    expect(resolveAutofillScopeDefaults({}, lookups)).toEqual({
      categoryId: undefined,
      propertyId: undefined,
      websiteDomain: undefined,
      tagIds: undefined,
      mediaTypeId: undefined,
      channelIds: undefined,
    });
  });

  it("resolves each facet slug to its id/domain", () => {
    expect(resolveAutofillScopeDefaults(
      {
        category: "recipes",
        property: "rating",
        website: "youtube",
        tag: "anything",
        mediaType: "video",
        channel: "anything",
      },
      lookups,
    )).toEqual({
      categoryId: "cat-1",
      propertyId: "prop-1",
      websiteDomain: "youtube.com",
      tagIds: ["tag-1"],
      mediaTypeId: "mt-1",
      channelIds: ["chan-1"],
    });
  });

  it("yields undefined for an unmatched slug", () => {
    const result = resolveAutofillScopeDefaults({
      category: "missing",
    }, lookups);
    expect(result.categoryId).toBeUndefined();
  });

  it("omits tag/channel ids when the slug is present but the entity did not resolve", () => {
    const result = resolveAutofillScopeDefaults(
      {
        tag: "t",
        channel: "c",
      },
      {
        ...lookups,
        tagId: undefined,
        channelId: undefined,
      },
    );
    expect(result.tagIds).toBeUndefined();
    expect(result.channelIds).toBeUndefined();
  });
});
