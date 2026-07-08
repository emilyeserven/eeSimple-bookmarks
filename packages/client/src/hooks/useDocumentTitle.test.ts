// @vitest-environment node
import type { BreadcrumbSegment } from "@/components/header/HeaderBreadcrumbs";

import { describe, expect, it } from "vitest";

import { buildDocumentTitle } from "./useDocumentTitle";

const crumb = (label: string): BreadcrumbSegment => ({
  label,
});

describe("buildDocumentTitle", () => {
  it("returns just the app name when there are no crumbs", () => {
    expect(buildDocumentTitle([], false)).toBe("eeSimple Bookmarks");
  });

  it("collapses the home route to just the app name", () => {
    expect(buildDocumentTitle([crumb("Home")], false)).toBe("eeSimple Bookmarks");
  });

  it("uses the single crumb for a listing page", () => {
    expect(buildDocumentTitle([crumb("Bookmarks")], false)).toBe(
      "Bookmarks · eeSimple Bookmarks",
    );
  });

  it("uses the deepest crumb for a detail page", () => {
    const crumbs = [crumb("Bookmarks"), crumb("Dev"), crumb("My Bookmark Title")];
    expect(buildDocumentTitle(crumbs, false)).toBe(
      "My Bookmark Title · eeSimple Bookmarks",
    );
  });

  it("joins the entity name with the section on an edit route", () => {
    const crumbs = [crumb("Bookmarks"), crumb("Dev"), crumb("My Bookmark Title"), crumb("Edit")];
    expect(buildDocumentTitle(crumbs, true)).toBe(
      "My Bookmark Title · Edit · eeSimple Bookmarks",
    );
  });

  it("falls back to the leaf when an edit route has only one crumb", () => {
    expect(buildDocumentTitle([crumb("Edit")], true)).toBe("Edit · eeSimple Bookmarks");
  });
});
