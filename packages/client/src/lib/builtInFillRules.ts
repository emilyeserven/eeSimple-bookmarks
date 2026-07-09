import type { Website } from "@eesimple/types";

/**
 * The read-only "built-in rules" shown on a website's Extension Fill tab: the **site-specific** fill
 * treatments the app performs automatically when a bookmark is created/scanned from *this* site,
 * without the browser extension. Only rules that **actually apply to the site** are returned — an
 * empty array means the site has none, and the section renders nothing.
 *
 * Global scan behaviors (generic page-metadata scrape, oEmbed, DuckDuckGo favicons, book metadata)
 * are **not** here — they apply to every site and live on the Settings → Connectors page instead.
 *
 * Pure + unit-tested (mirrors `lib/extensionFillForm.ts`): `label`/`source` are English natural keys
 * the component wraps in `t()`; `detail` carries resolved data (names) shown verbatim.
 */

/** One read-only, currently-active built-in fill rule for a site. */
export interface BuiltInFillRule {
  id: string;
  /** English natural key for the label, e.g. "Default category". */
  label: string;
  /** English natural key describing what the rule does. */
  source: string;
  /** Resolved value shown verbatim next to the label (e.g. the default category/tag names). */
  detail?: string;
}

/** Name resolvers so the builder stays pure (the component supplies them from `useTags`/`useMediaTypes`). */
export interface BuiltInFillRuleContext {
  tagNameById: (id: string) => string | undefined;
  mediaTypeNameById: (id: string) => string | undefined;
}

/** The website fields the built-in rules reflect. */
type BuiltInFillWebsite = Pick<
  Website,
  "category" | "tagIds" | "mediaTypeId" | "scanUrlForIsbn" | "alternateNames"
>;

/** Join resolved names, dropping ids that no longer resolve; `undefined` when nothing resolves. */
function resolveNames(ids: string[], resolve: (id: string) => string | undefined): string | undefined {
  const names = ids.map(resolve).filter((name): name is string => name !== undefined && name.length > 0);
  return names.length > 0 ? names.join(", ") : undefined;
}

/**
 * Build the site-specific built-in fill rules that are **currently active** for a website, reflecting
 * its live config. Returns `[]` when nothing applies. Order: ISBN, default category/tags/media type,
 * title-suffix removal.
 */
export function buildBuiltInFillRules(
  website: BuiltInFillWebsite,
  ctx: BuiltInFillRuleContext,
): BuiltInFillRule[] {
  const rules: BuiltInFillRule[] = [];

  if (website.scanUrlForIsbn) {
    rules.push({
      id: "isbn",
      label: "ISBN",
      source: "Reads the page for an ISBN (Amazon, O'Reilly, honto, or a generic scrape).",
    });
  }

  if (website.category) {
    rules.push({
      id: "default-category",
      label: "Default category",
      source: "Applied to new bookmarks saved from this site.",
      detail: website.category.name,
    });
  }

  const tagNames = resolveNames(website.tagIds ?? [], ctx.tagNameById);
  if (tagNames) {
    rules.push({
      id: "default-tags",
      label: "Default tags",
      source: "Applied to new bookmarks saved from this site.",
      detail: tagNames,
    });
  }

  const mediaTypeName = website.mediaTypeId ? ctx.mediaTypeNameById(website.mediaTypeId) : undefined;
  if (mediaTypeName) {
    rules.push({
      id: "default-media-type",
      label: "Default media type",
      source: "Applied to new bookmarks saved from this site.",
      detail: mediaTypeName,
    });
  }

  const alternateNames = (website.alternateNames ?? []).filter(name => name.length > 0);
  if (alternateNames.length > 0) {
    rules.push({
      id: "alternate-names",
      label: "Title suffix removal",
      source: "These names are stripped from the end of scanned titles.",
      detail: alternateNames.join(", "),
    });
  }

  return rules;
}
