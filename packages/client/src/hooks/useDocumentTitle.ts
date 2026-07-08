import type { BreadcrumbSegment } from "@/components/header/HeaderBreadcrumbs";

import { useEffect } from "react";

import i18n from "@/i18n";

/** The app name, appended to every page title. */
const APP_NAME = "eeSimple Bookmarks";

/**
 * Derive the browser `document.title` from the breadcrumb trail: `<current page/item> · <app name>`.
 *
 * The deepest crumb's label is the current page or item name (resolved entity names included). On
 * edit routes the trail ends in `[…, {entity name}, {section}]`, so we join the entity name with the
 * section (`My Bookmark · Edit`) instead of leaving a bare `Edit`. Home collapses to just the app
 * name. Pure and DOM-free so it can be unit-tested directly.
 */
export function buildDocumentTitle(crumbs: BreadcrumbSegment[], isEditRoute: boolean): string {
  if (crumbs.length === 0) return APP_NAME;
  const leaf = crumbs[crumbs.length - 1].label;
  const pagePart = isEditRoute && crumbs.length >= 2
    ? `${crumbs[crumbs.length - 2].label} · ${leaf}`
    : leaf;
  // The home route's single crumb is the "Home" label — the tab just reads the app name there.
  if (pagePart === i18n.t("Home")) return APP_NAME;
  return `${pagePart} · ${APP_NAME}`;
}

/**
 * Keep `document.title` in sync with the current route's breadcrumb trail. Re-runs whenever the
 * resolved title changes — including when async entity queries resolve a real name or the interface
 * language switches (both re-derive the crumbs).
 */
export function useDocumentTitle(crumbs: BreadcrumbSegment[], isEditRoute: boolean): void {
  const title = buildDocumentTitle(crumbs, isEditRoute);
  useEffect(() => {
    document.title = title;
  }, [title]);
}
