// @vitest-environment node
import { isValidElement } from "react";
import { describe, expect, it } from "vitest";

import { taxonomyEditLink } from "./toolbarActionTypes";

/** taxonomyEditLink returns an unrendered `<Link>` element, so its `to`/`params` are inspectable directly. */
function linkProps(node: unknown): { to: string;
  params: Record<string, string>; } | null {
  if (!isValidElement(node)) return null;
  const props = node.props as { to: string;
    params: Record<string, string>; };
  return {
    to: props.to,
    params: props.params,
  };
}

describe("taxonomyEditLink", () => {
  it("links a top-level categories/tags item to its General edit tab — including the bare listing", () => {
    // The Info header button became a listing tab; Edit now shows on the bare listing (length 2) too.
    expect(linkProps(taxonomyEditLink(["categories", "news"], "x"))).toEqual({
      to: "/categories/$categorySlug/edit",
      params: {
        categorySlug: "news",
      },
    });
    expect(linkProps(taxonomyEditLink(["categories", "news", "info"], "x"))).toEqual({
      to: "/categories/$categorySlug/edit",
      params: {
        categorySlug: "news",
      },
    });
    expect(linkProps(taxonomyEditLink(["tags", "fun", "gallery"], "x"))).toEqual({
      to: "/tags/$tagSlug/edit/general",
      params: {
        tagSlug: "fun",
      },
    });
  });

  it("links a /taxonomies/<entity>/<slug> item (incl. its bare listing) to its General edit tab", () => {
    expect(linkProps(taxonomyEditLink(["taxonomies", "websites", "example-com"], "x"))).toEqual({
      to: "/taxonomies/websites/$websiteSlug/edit/general",
      params: {
        websiteSlug: "example-com",
      },
    });
    expect(linkProps(taxonomyEditLink(["taxonomies", "youtube-channels", "abc", "info"], "x"))).toEqual({
      to: "/taxonomies/youtube-channels/$channelSlug/edit/general",
      params: {
        channelSlug: "abc",
      },
    });
  });

  it("returns null on the edit surface, the listing-of-all, unknown entities, and non-taxonomy paths", () => {
    // Never while already editing.
    expect(taxonomyEditLink(["categories", "news", "edit", "general"], "x")).toBeNull();
    // The listing-of-all index (no slug) gets no Edit button.
    expect(taxonomyEditLink(["categories"], "x")).toBeNull();
    expect(taxonomyEditLink(["taxonomies", "websites"], "x")).toBeNull();
    // Unknown entity / non-taxonomy paths.
    expect(taxonomyEditLink(["taxonomies", "not-a-real-entity", "x"], "x")).toBeNull();
    expect(taxonomyEditLink(["bookmarks"], "x")).toBeNull();
  });
});
