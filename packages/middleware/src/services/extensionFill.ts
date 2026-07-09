/**
 * Read-only assembly for the browser extension's "check & fill" mode (#1242): for a given URL,
 * tells the popup whether it matches an existing bookmark (offer to fill from the live page via the
 * matched website's `extensionFillRules`), is already pending in the Inbox, or is unseen. Pure
 * composition of existing services — no writes, no `invalidateBookmarkCache()`, no scan-cache
 * interaction.
 */

import type { ExtensionFillContext } from "@eesimple/types";
import { checkBookmarkUrlDuplicate, getBookmark } from "@/services/bookmarks";
import { listCustomProperties } from "@/services/customProperties";
import { listGroupsCompact } from "@/services/groups";
import { findPendingImportItemByUrl } from "@/services/imports";
import { listLocationsCompact } from "@/services/locations";
import { listPeopleCompact } from "@/services/people";
import { listTagsCompact } from "@/services/tags";
import { lookupWebsiteByUrl } from "@/services/websites";

export async function getExtensionFillContext(url: string): Promise<ExtensionFillContext> {
  const dup = await checkBookmarkUrlDuplicate(url);
  const matchedBookmarkId = dup.exactMatch?.id ?? dup.pathMatch?.id;

  if (!matchedBookmarkId) {
    const pending = await findPendingImportItemByUrl(url);
    return {
      mode: pending ? "inbox" : "unknown",
    };
  }

  const bookmark = await getBookmark(matchedBookmarkId);
  if (!bookmark) return {
    mode: "unknown",
  };

  const {
    website,
  } = await lookupWebsiteByUrl(url);
  const rules = website?.extensionFillRules ?? [];
  if (!website || rules.length === 0) {
    return {
      mode: "bookmark",
      bookmark,
    };
  }

  const propertyIds = [...new Set(
    rules.flatMap(rule => (rule.target.kind === "customProperty" ? [rule.target.propertyId] : [])),
  )];
  const properties = propertyIds.length === 0
    ? []
    : (await listCustomProperties()).filter(
      property => propertyIds.includes(property.id) && property.type !== "image" && property.type !== "file",
    );

  const taxonomyKinds = new Set(
    rules.flatMap(rule => (rule.target.kind === "taxonomy" ? [rule.target.taxonomy] : [])),
  );

  const taxonomies: ExtensionFillContext["taxonomies"] = {};
  if (taxonomyKinds.has("people")) taxonomies.people = await listPeopleCompact();
  if (taxonomyKinds.has("groups")) taxonomies.groups = await listGroupsCompact();
  if (taxonomyKinds.has("locations")) taxonomies.locations = await listLocationsCompact();
  if (taxonomyKinds.has("tags")) taxonomies.tags = await listTagsCompact();

  return {
    mode: "bookmark",
    bookmark,
    website: {
      id: website.id,
      siteName: website.siteName,
      extensionFillRules: rules,
    },
    ...(properties.length > 0 && {
      properties,
    }),
    ...(Object.keys(taxonomies).length > 0 && {
      taxonomies,
    }),
  };
}
