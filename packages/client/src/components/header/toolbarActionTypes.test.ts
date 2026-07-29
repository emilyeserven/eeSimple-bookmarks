// (Default jsdom environment: importing `taxonomyEditLink` now pulls the entity-descriptor registry
// via `ENTITY_ROUTES`, matching `lib/entityRoutes.test.ts`.)
import { isValidElement } from "react";
import { describe, expect, it } from "vitest";

import { taxonomyEditLink } from "./toolbarActionTypes";

/** taxonomyEditLink returns an unrendered `<Link>` element, so its `to`/`params` are inspectable directly. */
function linkProps(node: unknown): { to: string;
  params?: Record<string, string>; } | null {
  if (!isValidElement(node)) return null;
  const props = node.props as { to: string;
    params?: Record<string, string>; };
  return {
    to: props.to,
    ...(props.params
      ? {
        params: props.params,
      }
      : {}),
  };
}

describe("taxonomyEditLink", () => {
  it("links a top-level categories/tags item to its edit page — including the bare listing", () => {
    // The Info header button became a listing tab; Edit now shows on the bare listing (length 2) too.
    expect(linkProps(taxonomyEditLink(["categories", "news"], "x"))).toEqual({
      to: "/categories/news/edit",
    });
    expect(linkProps(taxonomyEditLink(["categories", "news", "info"], "x"))).toEqual({
      to: "/categories/news/edit",
    });
    expect(linkProps(taxonomyEditLink(["tags", "fun", "gallery"], "x"))).toEqual({
      to: "/tags/fun/edit",
    });
  });

  it("links a /taxonomies/<entity>/<slug> item (incl. its bare listing) to its edit page", () => {
    expect(linkProps(taxonomyEditLink(["taxonomies", "websites", "example-com"], "x"))).toEqual({
      to: "/taxonomies/websites/example-com/edit",
    });
    expect(linkProps(taxonomyEditLink(["taxonomies", "youtube-channels", "abc", "info"], "x"))).toEqual({
      to: "/taxonomies/youtube-channels/abc/edit",
    });
  });

  it("derives an edit link for every ENTITY_ROUTES kind — incl. the five that had none", () => {
    // Previously missing from the hand-written switch: location-relations, custom properties,
    // autofill rules, import rules, saved filters.
    expect(linkProps(taxonomyEditLink(["taxonomies", "location-relations", "borders"], "x"))).toEqual({
      to: "/taxonomies/location-relations/borders/edit",
    });
    expect(linkProps(taxonomyEditLink(["custom-properties", "rating"], "x"))).toEqual({
      to: "/custom-properties/rating/edit",
    });
    expect(linkProps(taxonomyEditLink(["custom-properties", "rating", "info"], "x"))).toEqual({
      to: "/custom-properties/rating/edit",
    });
    expect(linkProps(taxonomyEditLink(["autofill", "my-rule"], "x"))).toEqual({
      to: "/autofill/my-rule/edit",
    });
    expect(linkProps(taxonomyEditLink(["import-rules", "inbox-rule"], "x"))).toEqual({
      to: "/import-rules/inbox-rule/edit",
    });
    expect(linkProps(taxonomyEditLink(["saved-filters", "unread"], "x"))).toEqual({
      to: "/saved-filters/unread/edit",
    });
    // A sample of the previously-covered kinds keeps working through the derivation.
    expect(linkProps(taxonomyEditLink(["taxonomies", "genres-moods", "cozy"], "x"))).toEqual({
      to: "/taxonomies/genres-moods/cozy/edit",
    });
    expect(linkProps(taxonomyEditLink(["taxonomies", "locations", "tokyo", "info"], "x"))).toEqual({
      to: "/taxonomies/locations/tokyo/edit",
    });
  });

  it("links a custom-taxonomy term page to the shared term edit route", () => {
    expect(linkProps(taxonomyEditLink(["taxonomies", "japanese", "listening"], "x"))).toEqual({
      to: "/taxonomies/$taxonomyKey/$termSlug/edit",
      params: {
        taxonomyKey: "japanese",
        termSlug: "listening",
      },
    });
    expect(linkProps(taxonomyEditLink(["taxonomies", "japanese", "listening", "info"], "x"))).toEqual({
      to: "/taxonomies/$taxonomyKey/$termSlug/edit",
      params: {
        taxonomyKey: "japanese",
        termSlug: "listening",
      },
    });
  });

  it("returns null on the edit surface, the listing-of-all, create pages, and non-taxonomy paths", () => {
    // Never while already editing.
    expect(taxonomyEditLink(["categories", "news", "edit", "general"], "x")).toBeNull();
    expect(taxonomyEditLink(["taxonomies", "japanese", "listening", "edit"], "x")).toBeNull();
    // The listing-of-all index (no slug) gets no Edit button.
    expect(taxonomyEditLink(["categories"], "x")).toBeNull();
    expect(taxonomyEditLink(["taxonomies", "websites"], "x")).toBeNull();
    expect(taxonomyEditLink(["saved-filters"], "x")).toBeNull();
    // Create/fixed sub-pages of a built-in taxonomy are not term pages.
    expect(taxonomyEditLink(["taxonomies", "locations", "new"], "x")).toBeNull();
    expect(taxonomyEditLink(["custom-properties", "new"], "x")).toBeNull();
    expect(taxonomyEditLink(["autofill", "backfill"], "x")).toBeNull();
    // Non-taxonomy paths.
    expect(taxonomyEditLink(["bookmarks"], "x")).toBeNull();
  });
});
