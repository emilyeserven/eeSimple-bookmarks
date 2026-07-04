// @vitest-environment node
import { isValidElement } from "react";
import { describe, expect, it } from "vitest";

import { taxonomyViewLink } from "./toolbarActionTypes";

/** taxonomyViewLink returns an unrendered `<Link>` element, so its `to`/`params` are inspectable directly. */
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

describe("taxonomyViewLink", () => {
  it("links a top-level categories/tags item to its General view", () => {
    expect(linkProps(taxonomyViewLink(["categories", "news"], "x"))).toEqual({
      to: "/categories/$categorySlug/general",
      params: {
        categorySlug: "news",
      },
    });
    expect(linkProps(taxonomyViewLink(["tags", "fun"], "x"))).toEqual({
      to: "/tags/$tagSlug/general",
      params: {
        tagSlug: "fun",
      },
    });
  });

  it("links a /taxonomies/<entity>/<slug> item via the renderer table", () => {
    expect(linkProps(taxonomyViewLink(["taxonomies", "websites", "example-com"], "x"))).toEqual({
      to: "/taxonomies/websites/$websiteSlug/general",
      params: {
        websiteSlug: "example-com",
      },
    });
    expect(linkProps(taxonomyViewLink(["taxonomies", "youtube-channels", "abc"], "x"))).toEqual({
      to: "/taxonomies/youtube-channels/$channelSlug/general",
      params: {
        channelSlug: "abc",
      },
    });
    expect(linkProps(taxonomyViewLink(["taxonomies", "podcasts", "pod"], "x"))).toEqual({
      to: "/taxonomies/podcasts/$podcastSlug/general",
      params: {
        podcastSlug: "pod",
      },
    });
  });

  it("returns null for unknown entities, wrong lengths, and non-taxonomy paths", () => {
    expect(taxonomyViewLink(["taxonomies", "not-a-real-entity", "x"], "x")).toBeNull();
    expect(taxonomyViewLink(["taxonomies", "websites"], "x")).toBeNull();
    expect(taxonomyViewLink(["categories", "news", "edit"], "x")).toBeNull();
    expect(taxonomyViewLink(["bookmarks"], "x")).toBeNull();
  });
});
