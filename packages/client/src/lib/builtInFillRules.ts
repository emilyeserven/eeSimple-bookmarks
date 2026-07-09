import type { Website } from "@eesimple/types";

import { OEMBED_PROVIDERS } from "@eesimple/types";

/**
 * The read-only "built-in rules" shown on a website's Extension Fill tab: the fill treatments the app
 * performs **automatically when a bookmark is created from this site, without the browser extension**
 * (the `/api/scan` metadata pipeline, per-site ISBN detection, website source defaults, oEmbed
 * enrichment). These parallel the editable {@link WebsiteExtensionFillRule}s but are hardcoded in the
 * scan/create pipeline, so this module is a declarative mirror rendered read-only.
 *
 * Pure + unit-tested (mirrors `lib/extensionFillForm.ts`): `label`/`source` are English natural keys
 * the component wraps in `t()`; `state.detail` carries resolved data (names) shown verbatim.
 */

/** Which pipeline stage a built-in rule belongs to (drives the sub-header grouping). */
export type BuiltInFillGroup = "scan" | "isbn" | "defaults" | "oembed";

/** Live state of a per-site built-in rule, reflecting this website's configuration. */
export interface BuiltInFillRuleState {
  /**
   * `on`/`off` — a gated behavior (ISBN scanning); `value` — a configured default (with `detail`
   * holding the resolved name(s)); `unset` — a per-site default with nothing configured.
   */
  kind: "on" | "off" | "value" | "unset";
  /** Resolved data shown verbatim (e.g. the default category/tag/media-type names). */
  detail?: string;
}

/** One read-only built-in fill rule. */
export interface BuiltInFillRule {
  id: string;
  /** English natural key for the target/label, e.g. "Title". */
  label: string;
  /** English natural key describing where the value comes from. */
  source: string;
  group: BuiltInFillGroup;
  /** `global` rules run identically for every site; `site` rules reflect this website's config. */
  scope: "global" | "site";
  /** Present only for `site`-scoped rules. */
  state?: BuiltInFillRuleState;
  /** Provider names for the oEmbed rule (from `OEMBED_PROVIDERS`). */
  providers?: string[];
}

/** Name resolvers so the builder stays pure (the component supplies them from `useTags`/`useMediaTypes`). */
export interface BuiltInFillRuleContext {
  tagNameById: (id: string) => string | undefined;
  mediaTypeNameById: (id: string) => string | undefined;
}

/** The website fields the built-in rules reflect. */
type BuiltInFillWebsite = Pick<Website, "category" | "tagIds" | "mediaTypeId" | "scanUrlForIsbn">;

/** Globally built-in scan field fills — identical for every site. */
const SCAN_RULES: BuiltInFillRule[] = [
  {
    id: "scan-title",
    label: "Title",
    source: "From the page's title tag, og:title, or twitter:title (the site-name suffix is removed).",
    group: "scan",
    scope: "global",
  },
  {
    id: "scan-description",
    label: "Description",
    source: "From og:description, twitter:description, or the meta description.",
    group: "scan",
    scope: "global",
  },
  {
    id: "scan-image",
    label: "Image",
    source: "From og:image, twitter:image, JSON-LD, or the article's images.",
    group: "scan",
    scope: "global",
  },
  {
    id: "scan-favicon",
    label: "Favicon",
    source: "From the DuckDuckGo icon service for this domain.",
    group: "scan",
    scope: "global",
  },
  {
    id: "scan-people",
    label: "People",
    source: "Author names from og:article:person, matched to People or created.",
    group: "scan",
    scope: "global",
  },
  {
    id: "scan-language",
    label: "Language",
    source: "From og:locale or the page's html lang, matched to a Language or created.",
    group: "scan",
    scope: "global",
  },
];

/** Join resolved names, dropping ids that no longer resolve; `undefined` when nothing resolves. */
function resolveNames(ids: string[], resolve: (id: string) => string | undefined): string | undefined {
  const names = ids.map(resolve).filter((name): name is string => name !== undefined && name.length > 0);
  return names.length > 0 ? names.join(", ") : undefined;
}

/** A per-site default rule: `value` (with the resolved name) when configured, else `unset`. */
function defaultRule(id: string, label: string, resolved: string | undefined): BuiltInFillRule {
  return {
    id,
    label,
    source: "Applied to new bookmarks saved from this site.",
    group: "defaults",
    scope: "site",
    state: resolved !== undefined
      ? {
        kind: "value",
        detail: resolved,
      }
      : {
        kind: "unset",
      },
  };
}

/**
 * Build the ordered read-only built-in fill rules for a website, reflecting its live config for the
 * per-site rules (ISBN scanning on/off, the site's default category/tags/media type).
 */
export function buildBuiltInFillRules(
  website: BuiltInFillWebsite,
  ctx: BuiltInFillRuleContext,
): BuiltInFillRule[] {
  const isbnRule: BuiltInFillRule = {
    id: "isbn",
    label: "ISBN",
    source: "Reads the page for an ISBN (Amazon, O'Reilly, honto, or a generic scrape).",
    group: "isbn",
    scope: "site",
    state: {
      kind: website.scanUrlForIsbn ? "on" : "off",
    },
  };

  const defaults: BuiltInFillRule[] = [
    defaultRule("default-category", "Default category", website.category?.name ?? undefined),
    defaultRule("default-tags", "Default tags", resolveNames(website.tagIds ?? [], ctx.tagNameById)),
    defaultRule(
      "default-media-type",
      "Default media type",
      website.mediaTypeId ? ctx.mediaTypeNameById(website.mediaTypeId) : undefined,
    ),
  ];

  const oembedRule: BuiltInFillRule = {
    id: "oembed",
    label: "oEmbed enrichment",
    source: "Enriches title, description, and image for supported providers.",
    group: "oembed",
    scope: "global",
    providers: OEMBED_PROVIDERS.map(provider => provider.name),
  };

  return [...SCAN_RULES, isbnRule, ...defaults, oembedRule];
}
