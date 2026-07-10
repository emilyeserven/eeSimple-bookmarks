/**
 * Read-only assembly for the browser extension's "check & fill" mode (#1242): for a given URL,
 * tells the popup whether it matches an existing bookmark (offer to fill from the live page via the
 * matched website's `extensionFillRules`), is already pending in the Inbox, or is unseen. Pure
 * composition of existing services — no writes, no `invalidateBookmarkCache()`, no scan-cache
 * interaction.
 */

import type { Bookmark, ExtensionFillContext, TaxonomyEntityAssociation, TaxonomyEntityTermRef } from "@eesimple/types";
import { checkBookmarkUrlDuplicate, getBookmark } from "@/services/bookmarks";
import { listCategories } from "@/services/categories";
import { listCustomProperties } from "@/services/customProperties";
import { getGroupById, listGroups, listGroupsCompact } from "@/services/groups";
import { findPendingImportItemByUrl } from "@/services/imports";
import { listLocations, listLocationsCompact } from "@/services/locations";
import { listMediaTypes } from "@/services/mediaTypes";
import { getNewsletter } from "@/services/newsletters";
import { listPeople, listPeopleCompact } from "@/services/people";
import { listTags, listTagsCompact } from "@/services/tags";
import { getWebsite, lookupWebsiteByUrl, migrateExtensionFillRules } from "@/services/websites";
import { getYouTubeChannel } from "@/services/youtubeChannels";

export async function getExtensionFillContext(url: string): Promise<ExtensionFillContext> {
  const dup = await checkBookmarkUrlDuplicate(url);
  const matchedBookmarkId = dup.exactMatch?.id ?? dup.pathMatch?.id;

  if (!matchedBookmarkId) {
    const pending = await findPendingImportItemByUrl(url);
    return pending
      ? {
        mode: "inbox",
        inboxItemId: pending.id,
      }
      : {
        mode: "unknown",
      };
  }

  const bookmark = await getBookmark(matchedBookmarkId);
  if (!bookmark) return {
    mode: "unknown",
  };

  const {
    website,
  } = await lookupWebsiteByUrl(url);
  // Normalize any retired `pathSuffix`-only gate to `pathMatch` so the popup only ever sees the
  // canonical shape and gates correctly, even against a row that predates the boot backfill.
  const rawRules = website?.extensionFillRules ?? [];
  const rules = migrateExtensionFillRules(rawRules) ?? rawRules;
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

  // `taxonomyEntity` rules write into a linked term's fixed field — send the bookmark's current
  // linked terms (with their field values) for each referenced association so the popup can diff and
  // upsert.
  const associations = new Set(
    rules.flatMap(rule => (rule.target.kind === "taxonomyEntity" ? [rule.target.association] : [])),
  );
  const associatedTerms = await loadAssociatedTerms(bookmark, associations);

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
    ...(associatedTerms && {
      associatedTerms,
    }),
  };
}

/**
 * Load the bookmark's currently-linked term(s) for each referenced `taxonomyEntity` association,
 * with the current values of the writable fields. Associations the bookmark has no link for are
 * omitted (the popup renders a disabled "no linked …" row). Only referenced associations are loaded.
 */
async function loadAssociatedTerms(
  bookmark: Bookmark,
  associations: Set<TaxonomyEntityAssociation>,
): Promise<ExtensionFillContext["associatedTerms"]> {
  const out: Partial<Record<TaxonomyEntityAssociation, TaxonomyEntityTermRef[]>> = {};
  for (const association of associations) {
    const terms = await loadTermsFor(association, bookmark);
    if (terms.length > 0) out[association] = terms;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Resolve one association's linked term id(s) from the bookmark and load them as term refs. */
async function loadTermsFor(
  association: TaxonomyEntityAssociation,
  bookmark: Bookmark,
): Promise<TaxonomyEntityTermRef[]> {
  switch (association) {
    case "website": {
      const id = bookmark.website?.id;
      if (!id) return [];
      const w = await getWebsite(id);
      return w
        ? [{
          id: w.id,
          name: w.siteName,
          description: w.description,
          socialLinks: w.socialLinks,
        }]
        : [];
    }
    case "category": {
      const id = bookmark.categoryId;
      const c = (await listCategories()).find(x => x.id === id);
      return c
        ? [{
          id: c.id,
          name: c.name,
          description: c.description,
        }]
        : [];
    }
    case "mediaType": {
      const id = bookmark.mediaType?.id;
      if (!id) return [];
      const m = (await listMediaTypes()).find(x => x.id === id);
      return m
        ? [{
          id: m.id,
          name: m.name,
          description: m.description,
        }]
        : [];
    }
    case "youtubeChannel": {
      const id = bookmark.youtubeChannel?.id;
      if (!id) return [];
      const y = await getYouTubeChannel(id);
      return y
        ? [{
          id: y.id,
          name: y.name,
          description: y.description,
        }]
        : [];
    }
    case "newsletter": {
      const id = bookmark.newsletter?.id;
      if (!id) return [];
      const n = await getNewsletter(id);
      return n
        ? [{
          id: n.id,
          name: n.name,
          description: n.description,
        }]
        : [];
    }
    case "group": {
      const id = bookmark.group?.id;
      if (!id) return [];
      const g = await getGroupById(id);
      return g
        ? [{
          id: g.id,
          name: g.name,
          description: g.description,
          socialLinks: g.socialLinks,
          year: g.year,
        }]
        : [];
    }
    case "people": {
      const ids = new Set((bookmark.people ?? []).map(p => p.id));
      if (ids.size === 0) return [];
      return (await listPeople())
        .filter(p => ids.has(p.id))
        .map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          socialLinks: p.socialLinks,
        }));
    }
    case "groups": {
      const ids = new Set((bookmark.groups ?? []).map(g => g.id));
      if (ids.size === 0) return [];
      return (await listGroups())
        .filter(g => ids.has(g.id))
        .map(g => ({
          id: g.id,
          name: g.name,
          description: g.description,
          socialLinks: g.socialLinks,
          year: g.year,
        }));
    }
    case "tags": {
      const ids = new Set((bookmark.tags ?? []).map(t => t.id));
      if (ids.size === 0) return [];
      return (await listTags())
        .filter(t => ids.has(t.id))
        .map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
        }));
    }
    case "locations": {
      const ids = new Set((bookmark.locations ?? []).map(l => l.id));
      if (ids.size === 0) return [];
      return (await listLocations())
        .filter(l => ids.has(l.id))
        .map(l => ({
          id: l.id,
          name: l.name,
          description: l.description,
        }));
    }
  }
}
