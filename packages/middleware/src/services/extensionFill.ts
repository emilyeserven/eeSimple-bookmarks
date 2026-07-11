/**
 * Read-only assembly for the browser extension's "check & fill" mode (#1242): for a given URL,
 * tells the popup whether it matches an existing bookmark (offer to fill from the live page via the
 * matched website's `extensionFillRules`), is already pending in the Inbox, or is unseen. Pure
 * composition of existing services — no writes, no `invalidateBookmarkCache()`, no scan-cache
 * interaction.
 */

import type { Bookmark, ExtensionFillContext, TaxonomyEntityAssociation, TaxonomyEntityTermRef, Website, WebsiteExtensionFillRule } from "@eesimple/types";
import { isYouTubeVideoUrl } from "@eesimple/types";
import { checkBookmarkUrlDuplicate, getBookmark } from "@/services/bookmarks";
import { listCategories } from "@/services/categories";
import { getChaptersPropertyId, listCustomProperties } from "@/services/customProperties";
import { getGroupById, listGroups, listGroupsCompact } from "@/services/groups";
import { findPendingImportItemByUrl } from "@/services/imports";
import { listLocations, listLocationsCompact } from "@/services/locations";
import { listMediaTypes } from "@/services/mediaTypes";
import { getNewsletter } from "@/services/newsletters";
import { listPeople, listPeopleCompact } from "@/services/people";
import { listTags, listTagsCompact } from "@/services/tags";
import { getWebsite, lookupWebsiteByUrl, migrateExtensionFillRules } from "@/services/websites";
import { channelKeyFromUrl, getYouTubeChannel, getYouTubeChannelByKey } from "@/services/youtubeChannels";

export async function getExtensionFillContext(url: string): Promise<ExtensionFillContext> {
  const dup = await checkBookmarkUrlDuplicate(url);
  const matchedBookmarkId = dup.exactMatch?.id ?? dup.pathMatch?.id;

  // Look the website up once — both the bookmark path and the no-bookmark direct-taxonomy path use it.
  // Normalize any retired `pathSuffix`-only gate to `pathMatch` so the popup only ever sees the
  // canonical shape and gates correctly, even against a row that predates the boot backfill.
  const {
    website,
  } = await lookupWebsiteByUrl(url);
  const rawRules = website?.extensionFillRules ?? [];
  const storedRules = migrateExtensionFillRules(rawRules) ?? rawRules;

  if (!matchedBookmarkId) {
    // No saved bookmark: if the matched website carries `taxonomyDirect` rules that are *actionable*
    // here, offer to update the taxonomy entity directly (`mode: "taxonomy"`). "Actionable" = a
    // url-mode rule actually resolved an entity from this URL, or there's a match-mode rule (resolved
    // in-browser; the popup path-gates it and falls back to the Inbox if it gates to nothing). This
    // keeps a plain content page on a rule-carrying site (e.g. a video page vs. a channel page) on the
    // normal inbox/unknown path so it still auto-saves.
    const directRules = storedRules.filter(rule => rule.target.kind === "taxonomyDirect");
    if (website && directRules.length > 0) {
      const taxonomyContext = await buildTaxonomyMode(url, website, storedRules);
      const hasMatchRule = directRules.some(
        rule => rule.target.kind === "taxonomyDirect" && rule.target.resolve.mode === "match",
      );
      if (taxonomyContext.associatedTerms || hasMatchRule) {
        return taxonomyContext;
      }
    }
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

  // Zero-config built-in: a saved YouTube video auto-offers its description timestamps into the
  // built-in "Chapters" sections property, with no per-site rule setup. Runtime-only (never stored).
  const rules = [...storedRules, ...(await buildYouTubeChaptersRules(url))];
  if (rules.length === 0) {
    return {
      mode: "bookmark",
      bookmark,
    };
  }

  const propertyIds = [...new Set(
    rules.flatMap(rule =>
      rule.target.kind === "customProperty" || rule.target.kind === "sections"
        ? [rule.target.propertyId]
        : []),
  )];
  const properties = propertyIds.length === 0
    ? []
    : (await listCustomProperties()).filter(
      property => propertyIds.includes(property.id) && property.type !== "image" && property.type !== "file",
    );

  const taxonomyKinds = new Set(
    rules.flatMap(rule => (rule.target.kind === "taxonomy" ? [rule.target.taxonomy] : [])),
  );

  // A `publisher` target resolves a name to a Group and sets the bookmark's singular `groupId`, so it
  // also needs the Groups option list for match-or-create in the popup.
  const needsGroups = taxonomyKinds.has("groups")
    || rules.some(rule => rule.target.kind === "publisher");

  const taxonomies: ExtensionFillContext["taxonomies"] = {};
  if (taxonomyKinds.has("people")) taxonomies.people = await listPeopleCompact();
  if (needsGroups) taxonomies.groups = await listGroupsCompact();
  if (taxonomyKinds.has("locations")) taxonomies.locations = await listLocationsCompact();
  if (taxonomyKinds.has("tags")) taxonomies.tags = await listTagsCompact();

  // `taxonomyEntity` rules write into a linked term's fixed field — send the bookmark's current
  // linked terms (with their field values) for each referenced association so the popup can diff and
  // upsert.
  const associations = new Set(
    rules.flatMap(rule => (rule.target.kind === "taxonomyEntity" ? [rule.target.association] : [])),
  );
  const linkedTerms = await loadAssociatedTerms(bookmark, associations);
  // `taxonomyDirect` url-mode rules also resolve an entity from the URL — fold those in so a saved
  // bookmark visit can still update the site/channel entity directly.
  const directTerms = await resolveDirectUrlTerms(url, website, rules);
  const associatedTerms = mergeAssociatedTerms(linkedTerms, directTerms);

  return {
    mode: "bookmark",
    bookmark,
    website: {
      // youtube.com is a seeded built-in website, so `website` is present for a saved YT video; the
      // fallback only guards a hypothetical missing record (the synthetic rule still needs a shell).
      id: website?.id ?? "youtube-chapters",
      siteName: website?.siteName ?? "YouTube",
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
 * Assemble the `mode: "taxonomy"` context for a website match with no bookmark: the website shell +
 * rules (the popup filters to `taxonomyDirect` and path-gates) + the URL-resolved entity term(s) for
 * each `resolve.mode: "url"` rule. Read-only composition of `lookupWebsiteByUrl` / the YouTube lookups.
 */
async function buildTaxonomyMode(
  url: string,
  website: NonNullable<Awaited<ReturnType<typeof lookupWebsiteByUrl>>["website"]>,
  storedRules: WebsiteExtensionFillRule[],
): Promise<ExtensionFillContext> {
  const associatedTerms = await resolveDirectUrlTerms(url, website, storedRules);
  return {
    mode: "taxonomy",
    website: {
      id: website.id,
      siteName: website.siteName,
      extensionFillRules: storedRules,
    },
    ...(associatedTerms && {
      associatedTerms,
    }),
  };
}

/**
 * Resolve the URL-matchable entity for each `taxonomyDirect` rule with `resolve.mode: "url"` — a
 * Website (by `domain`, already fetched) or a YouTube channel (by `channelKey`). `match`-mode rules
 * are omitted (their entity is scraped and resolved in-browser). Returns `undefined` when none resolve.
 */
async function resolveDirectUrlTerms(
  url: string,
  website: Website | null,
  rules: WebsiteExtensionFillRule[],
): Promise<ExtensionFillContext["associatedTerms"]> {
  const associations = new Set(
    rules.flatMap(rule =>
      (rule.target.kind === "taxonomyDirect" && rule.target.resolve.mode === "url"
        ? [rule.target.association]
        : [])),
  );
  const out: Partial<Record<TaxonomyEntityAssociation, TaxonomyEntityTermRef[]>> = {};
  for (const association of associations) {
    const term = await resolveDirectUrlTerm(association, url, website);
    if (term) out[association] = [term];
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Resolve one url-mode association's entity to a term ref (website / youtubeChannel only). */
async function resolveDirectUrlTerm(
  association: TaxonomyEntityAssociation,
  url: string,
  website: Website | null,
): Promise<TaxonomyEntityTermRef | null> {
  if (association === "website") {
    return website
      ? {
        id: website.id,
        name: website.siteName,
        description: website.description,
        socialLinks: website.socialLinks,
        imageUrl: website.imageUrl,
      }
      : null;
  }
  if (association === "youtubeChannel") {
    const key = channelKeyFromUrl(url);
    const channel = key ? await getYouTubeChannelByKey(key) : null;
    return channel
      ? {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        imageUrl: channel.imageUrl,
      }
      : null;
  }
  // Other associations are not URL-resolvable (the schema/editor restrict url-mode to the two above).
  return null;
}

/** Union two `associatedTerms` maps, de-duping each association's terms by id (linked wins ordering). */
function mergeAssociatedTerms(
  a: ExtensionFillContext["associatedTerms"],
  b: ExtensionFillContext["associatedTerms"],
): ExtensionFillContext["associatedTerms"] {
  if (!a) return b;
  if (!b) return a;
  const out: Partial<Record<TaxonomyEntityAssociation, TaxonomyEntityTermRef[]>> = {
    ...a,
  };
  for (const association of Object.keys(b) as TaxonomyEntityAssociation[]) {
    const existing = out[association] ?? [];
    const seen = new Set(existing.map(term => term.id));
    out[association] = [...existing, ...(b[association] ?? []).filter(term => !seen.has(term.id))];
  }
  return out;
}

/**
 * CSS selector for the YouTube watch-page element whose text carries the description (where creators
 * put chapter timestamps). Its textContent is present even while the description is visually collapsed.
 * NOTE: YouTube's DOM is not versioned in this repo — verify/adjust against the live page if it drifts.
 */
const YOUTUBE_DESCRIPTION_SELECTOR = "#description-inline-expander";

/**
 * The zero-config built-in: for a saved YouTube video, a single synthetic `sections` rule that parses
 * the description's timestamps into the built-in "Chapters" property. Returns `[]` for non-YouTube
 * URLs or before the Chapters property is seeded. Never stored — assembled fresh per request.
 */
async function buildYouTubeChaptersRules(url: string): Promise<WebsiteExtensionFillRule[]> {
  if (!isYouTubeVideoUrl(url)) return [];
  const propertyId = await getChaptersPropertyId();
  if (!propertyId) return [];
  return [
    {
      id: "builtin-youtube-chapters",
      label: "Chapters",
      target: {
        kind: "sections",
        propertyId,
        entryType: "timestamp",
      },
      extract: {
        selector: YOUTUBE_DESCRIPTION_SELECTOR,
      },
    },
  ];
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
