/**
 * Read-only assembly for the browser extension's "check & fill" mode (#1242): for a given URL,
 * tells the popup whether it matches an existing bookmark (offer to fill from the live page via the
 * matched website's `extensionFillRules`), is already pending in the Inbox, or is unseen. Pure
 * composition of existing services — no writes, no `invalidateBookmarkCache()`, no scan-cache
 * interaction.
 */

import type { Bookmark, ExtensionFillContext, TaxonomyEntityAssociation, TaxonomyEntityAssociationSpec, TaxonomyEntityLanguageOwnerType, TaxonomyEntityRelationKey, TaxonomyEntityTermRef, WebsiteExtensionFillRule } from "@eesimple/types";
import { isYouTubeVideoUrl, TAXONOMY_ENTITY_SPECS } from "@eesimple/types";
import { checkBookmarkUrlDuplicate, getBookmark } from "@/services/bookmarks";
import { listCategories } from "@/services/categories";
import { getChaptersPropertyId, listCustomProperties } from "@/services/customProperties";
import { getGroupById, listGroups, listGroupsCompact } from "@/services/groups";
import { findPendingImportItemByUrl } from "@/services/imports";
import { listLanguages } from "@/services/languages";
import { listLanguageUsageLevels } from "@/services/languageUsageLevels";
import { getLanguageUsages } from "@/services/languageUsages";
import { listLocations, listLocationsCompact } from "@/services/locations";
import { listMediaTypes } from "@/services/mediaTypes";
import { getNewsletter } from "@/services/newsletters";
import { listPeople, listPeopleCompact } from "@/services/people";
import { listTags, listTagsCompact } from "@/services/tags";
import { getWebsite, listWebsitesCompact, lookupWebsiteByUrl, migrateExtensionFillRules } from "@/services/websites";
import { getYouTubeChannel, listYouTubeChannelsCompact } from "@/services/youtubeChannels";

/** The "Primary Language" availability-level name a `language` target attaches to (mirrors the client). */
const PRIMARY_LANGUAGE_LEVEL_NAME = "primary language";

/**
 * What extra per-term data a `taxonomyEntity` rule set needs for one association: which relation
 * id-arrays to hydrate (for `relation:<key>` targets) and whether to hydrate language usages (for a
 * `language` target). Non-referenced associations skip the extra queries.
 */
interface AssociationHydration {
  relations: Set<TaxonomyEntityRelationKey>;
  language: boolean;
}

/** Parse a `taxonomyEntity` target's `field` into its write mode. */
function taxonomyEntityWriteMode(
  field: string,
): { kind: "scalar" } | { kind: "relation";
  key: TaxonomyEntityRelationKey; } | { kind: "language" } {
  if (field === "language") return {
    kind: "language",
  };
  if (field.startsWith("relation:")) {
    return {
      kind: "relation",
      key: field.slice("relation:".length) as TaxonomyEntityRelationKey,
    };
  }
  return {
    kind: "scalar",
  };
}

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
  const storedRules = migrateExtensionFillRules(rawRules) ?? rawRules;
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

  // `taxonomyEntity` rules write into a linked term's field / relation / language — send the
  // bookmark's current linked terms for each referenced association (hydrating the exact extra data
  // each target mode needs) so the popup can diff and upsert.
  const hydration = new Map<TaxonomyEntityAssociation, AssociationHydration>();
  for (const rule of rules) {
    if (rule.target.kind !== "taxonomyEntity") continue;
    const entry = hydration.get(rule.target.association)
      ?? {
        relations: new Set<TaxonomyEntityRelationKey>(),
        language: false,
      };
    const mode = taxonomyEntityWriteMode(rule.target.field);
    if (mode.kind === "relation") entry.relations.add(mode.key);
    else if (mode.kind === "language") entry.language = true;
    hydration.set(rule.target.association, entry);
  }
  const associatedTerms = await loadAssociatedTerms(bookmark, hydration);

  // Relation targets match an extracted name against the related taxonomy's compact option list.
  const relationOptions = await loadRelationOptions(hydration);
  // Any `language` target needs the languages list (match-or-create by isoCode) + the primary level.
  const languageReferenced = [...hydration.values()].some(h => h.language);
  const languageBlock = languageReferenced ? await loadLanguageBlock() : undefined;

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
    ...(relationOptions && {
      relationOptions,
    }),
    ...(languageBlock && {
      languages: languageBlock.languages,
      primaryLanguageLevelId: languageBlock.primaryLanguageLevelId,
    }),
  };
}

/** Compact option lists for the related taxonomies referenced by `relation:<key>` targets. */
async function loadRelationOptions(
  hydration: Map<TaxonomyEntityAssociation, AssociationHydration>,
): Promise<ExtensionFillContext["relationOptions"]> {
  const keys = new Set<TaxonomyEntityRelationKey>();
  for (const entry of hydration.values()) {
    for (const key of entry.relations) keys.add(key);
  }
  if (keys.size === 0) return undefined;
  const out: NonNullable<ExtensionFillContext["relationOptions"]> = {};
  if (keys.has("groups")) out.groups = await listGroupsCompact();
  if (keys.has("websites")) out.websites = await listWebsitesCompact();
  if (keys.has("youtubeChannels")) out.youtubeChannels = await listYouTubeChannelsCompact();
  return out;
}

/** The languages list + the resolved "Primary Language" availability-level id (null when absent). */
async function loadLanguageBlock(): Promise<{
  languages: NonNullable<ExtensionFillContext["languages"]>;
  primaryLanguageLevelId: string | null;
}> {
  const [languages, levels] = await Promise.all([
    listLanguages(),
    listLanguageUsageLevels("availability"),
  ]);
  const primaryLevel = levels.find(l => l.name.toLowerCase() === PRIMARY_LANGUAGE_LEVEL_NAME);
  return {
    languages: languages.map(l => ({
      id: l.id,
      name: l.name,
      isoCode: l.isoCode,
    })),
    primaryLanguageLevelId: primaryLevel?.id ?? null,
  };
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
 * omitted (the popup renders a disabled "no linked …" row). Only referenced associations are loaded,
 * and each term is hydrated with the exact extra data its target modes need (relation id-arrays for
 * `relation:<key>` targets, language usages for a `language` target).
 */
async function loadAssociatedTerms(
  bookmark: Bookmark,
  hydration: Map<TaxonomyEntityAssociation, AssociationHydration>,
): Promise<ExtensionFillContext["associatedTerms"]> {
  const out: Partial<Record<TaxonomyEntityAssociation, TaxonomyEntityTermRef[]>> = {};
  for (const [association, needs] of hydration) {
    const terms = await loadTermsFor(association, bookmark, needs);
    if (terms.length > 0) out[association] = terms;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Attach current language usages to each term when a `language` target references this association
 * (an availability/proficiency owner). Runs a `getLanguageUsages` per term — only for the small
 * linked-term set of a language-owner association, and only when referenced.
 */
async function attachLanguageUsages(
  terms: TaxonomyEntityTermRef[],
  ownerType: TaxonomyEntityLanguageOwnerType,
): Promise<void> {
  for (const term of terms) {
    const usages = await getLanguageUsages(ownerType, term.id);
    term.languageUsages = usages.map(u => ({
      languageId: u.language.id,
      usageLevelId: u.level.id,
    }));
  }
}

/** Resolve one association's linked term id(s) from the bookmark and load them as term refs. */
async function loadTermsFor(
  association: TaxonomyEntityAssociation,
  bookmark: Bookmark,
  needs: AssociationHydration,
): Promise<TaxonomyEntityTermRef[]> {
  const terms = await loadBaseTermsFor(association, bookmark, needs);
  const spec: TaxonomyEntityAssociationSpec = TAXONOMY_ENTITY_SPECS[association];
  const ownerType = spec.languageOwnerType;
  if (needs.language && ownerType && terms.length > 0) {
    await attachLanguageUsages(terms, ownerType);
  }
  return terms;
}

/** Resolve one association's linked term refs with their scalar + (when referenced) relation fields. */
async function loadBaseTermsFor(
  association: TaxonomyEntityAssociation,
  bookmark: Bookmark,
  needs: AssociationHydration,
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
          // Relation id-arrays for `relation:<key>` targets — only when referenced (they ride on the
          // already-loaded record, so this is a lean spread, not an extra query).
          ...(needs.relations.has("groups") && {
            groupIds: p.groupIds,
          }),
          ...(needs.relations.has("websites") && {
            websiteIds: p.websiteIds,
          }),
          ...(needs.relations.has("youtubeChannels") && {
            youtubeChannelIds: p.youtubeChannelIds,
          }),
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
          ...(needs.relations.has("websites") && {
            websiteIds: g.websiteIds,
          }),
          ...(needs.relations.has("youtubeChannels") && {
            youtubeChannelIds: g.youtubeChannelIds,
          }),
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
