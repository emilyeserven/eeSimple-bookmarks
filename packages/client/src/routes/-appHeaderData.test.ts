// @vitest-environment node
import { describe, expect, it } from "vitest";

import { resolveAddChild, resolvePinContext, slugFor } from "./-appHeaderData";

describe("slugFor", () => {
  const parts = (p: string) => p.split("/").filter(Boolean);

  it("returns the segment at index when on the prefix's pages", () => {
    expect(slugFor("/categories/recipes", parts("/categories/recipes"), "/categories", 1)).toBe("recipes");
    expect(slugFor("/categories", parts("/categories"), "/categories", 1)).toBe("");
  });

  it("returns empty string off the prefix (so by-slug hooks short-circuit)", () => {
    expect(slugFor("/tags/foo", parts("/tags/foo"), "/categories", 1)).toBe("");
  });

  it("does not match a prefix that is only a string prefix of another segment", () => {
    expect(slugFor("/categories-archive/x", parts("/categories-archive/x"), "/categories", 1)).toBe("");
  });
});

describe("resolvePinContext", () => {
  it("returns null when nothing is resolved", () => {
    expect(resolvePinContext({})).toBeNull();
  });

  it("prefers category, then website, then media type, then channel, then tag", () => {
    expect(resolvePinContext({
      category: {
        id: "c",
        name: "Cat",
      },
      website: {
        id: "w",
        siteName: "Site",
      },
    })).toEqual({
      entityType: "category",
      entityId: "c",
      label: "Cat",
    });

    expect(resolvePinContext({
      website: {
        id: "w",
        siteName: "Site",
      },
      mediaType: {
        id: "m",
        name: "Media",
      },
    })).toEqual({
      entityType: "website",
      entityId: "w",
      label: "Site",
    });

    expect(resolvePinContext({
      currentTag: {
        id: "t",
        name: "Tag",
      },
    })).toEqual({
      entityType: "tag",
      entityId: "t",
      label: "Tag",
    });
  });
});

describe("resolveAddChild", () => {
  it("offers a tag child on a tag detail page", () => {
    expect(resolveAddChild({
      pathParts: ["tags", "cooking"],
      tagParentId: "tag-1",
      mediaTypeId: undefined,
    })).toEqual({
      kind: "tag",
      parentId: "tag-1",
    });
  });

  it("offers a media-type child on a media-type detail page", () => {
    expect(resolveAddChild({
      pathParts: ["taxonomies", "media-types", "video"],
      tagParentId: undefined,
      mediaTypeId: "mt-1",
    })).toEqual({
      kind: "mediaType",
      parentId: "mt-1",
    });
  });

  it("returns null on a listing page or unrelated route", () => {
    expect(resolveAddChild({
      pathParts: ["tags"],
      tagParentId: undefined,
      mediaTypeId: undefined,
    })).toBeNull();
    expect(resolveAddChild({
      pathParts: ["bookmarks"],
      tagParentId: undefined,
      mediaTypeId: undefined,
    })).toBeNull();
  });
});
