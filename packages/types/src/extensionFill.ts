/**
 * Per-website extraction rules for the browser extension's "check & fill" mode: when the current
 * tab's URL matches an existing bookmark, these rules drive scraping the live page for field /
 * custom-property / taxonomy values to offer back to the user (part of #1239). Stored as nullable
 * jsonb on `websites.extension_fill_rules`.
 */

import type { ExtensionFillRuleGroup } from "./extensionFillGroups.js";
import type { TaxonomyDirectFieldKey, TaxonomyEntityAssociation, TaxonomyEntityTermRef, TaxonomyEntityWriteKey } from "./extensionFillTaxonomy.js";
import type { Bookmark, CustomProperty } from "./index.js";
import type { SocialMediaPlatform } from "./socialMedia.js";

/**
 * Optional per-rule URL-path gate. A rule with a `pathMatch` applies only when the current tab's
 * pathname matches — letting one website carry different fill rules for different paths (e.g. an
 * O'Reilly `/course/…` rule vs a `/library/view/…` rule). Absent = the rule always applies. No
 * `caseSensitive` — URL paths are effectively case-sensitive.
 */
export interface PathMatch {
  mode: "prefix" | "contains" | "suffix" | "regex";
  value: string;
}

/** One configured extraction rule for a website. */
export interface WebsiteExtensionFillRule {
  /** Stable uuid — checkbox + editor list identity. */
  id: string;
  /** Shown in the popup row + editor, e.g. "Print length". */
  label: string;
  /** Optional path gate — the rule applies only when the current path matches (absent = always). */
  pathMatch?: PathMatch;
  target: FillTarget;
  extract: FillExtract;
  /**
   * Membership in an {@link ExtensionFillRuleGroup} (`extensionFillGroups.ts`). The group's (and its
   * parent's) override values are **materialized** onto this rule's `target`/`pathMatch`, so the
   * stored rule is always self-complete — the extension ignores this field.
   */
  groupId?: string;
}

/**
 * How a `taxonomyDirect` rule resolves *which* taxonomy entity to update from the current page.
 * - `"url"` — the server auto-matches the entity from the tab URL. Valid only for `website` (by
 *   `domain`) and `youtubeChannel` (by `channelKey`) — the two URL-matchable associations. The matched
 *   entity arrives in {@link ExtensionFillContext.associatedTerms} for the popup to diff.
 * - `"match"` — the engine scrapes an identifier/name off the page via `select` (its own
 *   {@link FillExtract}); the popup then match-or-creates the entity against the association's REST
 *   list. Use this for entities with no URL-matchable key (e.g. a person/group on an arbitrary page).
 */
export type EntityResolution
  = | { mode: "url" }
    | { mode: "match";
      select: FillExtract; };

/** What a rule's extracted value(s) are applied to. */
export type FillTarget
  = | { kind: "field";
    field: "title" | "description" | "isbn" | "year"; }
  /**
   * Value kind is derived from the property's type; file/image-typed custom *properties* are
   * excluded (grab an image via the dedicated `image` target below). For a multi-value property the
   * rule fills one specific sub-value: `subField` picks the number of a Two-Numbers (`itemInItems`)
   * property; `choiceValue` picks the option of a `choices` property; `ratingBound` picks the From
   * or To end of a range-enabled `ratingScale` property (absent for a single-value rating).
   *
   * `ratingBound: "range"` is the auto-detect mode: instead of filling one end from the rule's
   * `extract`, the popup evaluates the per-level {@link ratingLevels} detectors against the page and
   * sets the range to `[min, max]` of the **present** levels — so one rule covers a whole scale
   * (e.g. "beginner" + "intermediate" present → From 1, To 2). Only meaningful for a range-enabled
   * `ratingScale`; `ratingSelector`/`ratingMatchExact`/`ratingLevels` are read only in this mode.
   * `ratingSelector` is the shared CSS selector applied to every level (a level may override it with
   * its own `selector`); `ratingMatchExact` globally controls how each level's `matchText` is compared
   * — absent/`true` = exact (`equals`), `false` = `contains`. `ratingMatchCaseSensitive` globally
   * controls case sensitivity — absent/`false` = case-insensitive, `true` = case-sensitive.
   */
    | { kind: "customProperty";
      propertyId: string;
      subField?: "current" | "total";
      choiceValue?: string;
      ratingBound?: "from" | "to" | "range";
      ratingSelector?: string;
      ratingMatchExact?: boolean;
      ratingMatchCaseSensitive?: boolean;
      ratingLevels?: RatingLevelDetector[]; }
  /** Multi-value; unmatched names create a name-only stub. */
      | { kind: "taxonomy";
        taxonomy: "people" | "groups" | "locations" | "tags"; }
  /**
   * Grab an image URL off the page (typically an `<img>`'s `src` via `read: {kind:"attr"}`); the
   * extension downloads the bytes in the browser and uploads them to the bookmark. `setMain` makes
   * the grabbed image the bookmark's main/primary image (defaults to true in the editor).
   */
        | { kind: "image";
          setMain?: boolean; }
  /**
   * Write the extracted value into a taxonomy term the bookmark is **linked to** (not the bookmark
   * itself). `association` selects which linked taxonomy provides the term(s); when the bookmark links
   * to exactly one term the popup targets it automatically, otherwise it lets the user pick one.
   * `field` is a {@link TaxonomyEntityWriteKey} — one of three modes:
   * - a **scalar field** (name/description/year/socialLink) — e.g. put `@OReillyMedia` into the
   *   publisher Group's X social link (`socialPlatform` is required when `field === "socialLink"`);
   * - a **relation** (`relation:groups`/`relation:websites`/`relation:youtubeChannels`) — resolve the
   *   extracted name(s) to term id(s) and **union** them into the linked term's id-array (e.g. add a
   *   Group to a linked Person's groups);
   * - **`language`** — resolve the extracted page-language code to a `Language` (match-or-create by
   *   `isoCode`) and attach it at the "Primary Language" level on the linked term (website/youtubeChannel/
   *   person owners only).
   * See {@link TAXONOMY_ENTITY_SPECS} for which modes each association supports.
   */
          | { kind: "taxonomyEntity";
            association: TaxonomyEntityAssociation;
            field: TaxonomyEntityWriteKey;
            socialPlatform?: SocialMediaPlatform; }
  /**
   * Update a taxonomy **entity** resolved from the current page directly (not via a linked bookmark).
   * `resolve` selects the entity (see {@link EntityResolution}); `field` is one of the entity's writable
   * fields *plus* `"image"` (an avatar/poster upload — see {@link TaxonomyDirectFieldKey}), constrained
   * to what {@link TAXONOMY_ENTITY_SPECS} lists (`image` requires the spec's `image: true`). The rule's
   * top-level `extract` produces the field value (or, for `field: "image"`, the image URL);
   * `resolve.select` (match mode) separately produces the entity identifier. `socialPlatform` is
   * required when `field === "socialLink"`. This is what lets Extension Fill fire on a page that is a
   * taxonomy entity's source rather than a saved bookmark.
   */
            | { kind: "taxonomyDirect";
              association: TaxonomyEntityAssociation;
              resolve: EntityResolution;
              field: TaxonomyDirectFieldKey;
              socialPlatform?: SocialMediaPlatform; }
  /**
   * Build a `sections`-typed custom property's value from the page. Unlike the scalar targets this
   * produces a **structured** result (a list of `SectionEntry`s, optionally two-tier). `extract` is
   * interpreted by `entryType`:
   * - **`name`** — a plain titled list (e.g. a course curriculum's lecture names). `extract.selector`
   *   matches the repeated **item** elements and `itemName` (or the item's own text) supplies each
   *   name; no value pipeline runs and `startValue` stays `""`. `container`/`header`/`sectionMatch`
   *   still group it, and `itemUrl` still optionally attaches a per-item link.
   * - **`url` / `page`** — `extract.selector` matches the repeated **item** elements; `extract.read`
   *   + `extract.transform` produce each item's `startValue` (e.g. `read:{kind:"attr",name:"href"}`
   *   for `url`, `transform:[{kind:"number"}]` for `page`). `itemName` (a relative `querySelector`)
   *   reads each item's name (absent = the item's own text). `itemUrl` (a relative `querySelector`)
   *   optionally reads a per-item link's `href` into the entry's `url`, so the matched item can be a
   *   **container** holding a separate name element and link element (siblings) rather than the link
   *   itself; absent = today's behavior (the item element carries the value/link via `extract.read`).
   *   `resolveItemUrl` (opt-in) resolves that `href` against the page URL (`new URL(href, pageUrl)`),
   *   turning a relative link ("/c/react/why") into an absolute one; unset = the raw `href` is kept.
   *   When `container` is set the rule is **tiered**: `container` matches the repeated tier-1 group,
   *   `header` (relative) reads the group name, and `extract.selector` matches the group's items.
   *   When `sectionMatch` is set the rule is instead **grouped by item text**: `extract.selector`
   *   matches one **flat** list of items (no grouping container in the DOM — e.g. an O'Reilly ToC
   *   where "Part 1" / "Chapter 1" / "Chapter 2" / "Part 2" are all siblings), and each item whose
   *   name matches `sectionMatch` opens a new top-level section that keeps its own value/link and
   *   nests the following non-matching items as its children; items before the first match stay
   *   top-level. `sectionMatch` takes precedence over `container` when both are set.
   *   When `sectionHeaderSelector` is set the rule is instead **grouped by section header**:
   *   `extract.selector` matches the items and `sectionHeaderSelector` matches each section header,
   *   both as **global** page selectors (no per-section wrapper element — e.g. a Udemy course
   *   curriculum where section titles and lecture titles are interleaved siblings in the DOM). The
   *   engine walks the matched headers + items in document order and nests each item under the most
   *   recent preceding header (a header's name is its matched element's own text); items before the
   *   first header stay top-level. Precedence: `sectionMatch` > `sectionHeaderSelector` > `container`.
   * - **`timestamp`** — `extract.selector` matches the element(s) whose **text** carries a list of
   *   `m:ss` / `h:mm:ss` timestamp lines (e.g. a video description); the engine parses each line into
   *   a flat entry whose `startValue` is the total number of **seconds**. `container`/`header`/
   *   `itemName`/`sectionMatch`/`sectionHeaderSelector` are ignored.
   *
   * **`nameParts`** (all entry types) — compose each item's NAME from **multiple** child elements
   * instead of the single `itemName` selector. Each {@link SectionNamePart} targets a relative child
   * (or the item element itself), applies its own filters/read/transforms, and the resolved non-empty
   * parts are joined with {@link namePartSeparator} (default `""`). Use it when a repeated item wraps
   * several elements — e.g. a `<span class="badge">quiz</span>` + `<span class="title">Why React?</span>`
   * composed into `"Quiz: Why React?"`. When `nameParts` is absent (or empty) the name still comes from
   * `itemName`/the item's own text. Only the name is composed; the value/url pipeline is unchanged.
   *
   * **`extract.filters`** apply to the matched **items** in every grouping mode (parity with the flat
   * non-sections path): an `exclude` / `excludeSelector` filter drops whole item candidates before each
   * leaf is built, so e.g. an `excludeSelector: ".badge"` removes stray badge rows. (This is distinct
   * from per-`nameParts` `filters`, which only narrow which element a name part reads.)
   *
   * **`exhaustive`** (opt-in) — when set, the `BookmarkSectionsValue` written on fill is flagged
   * `exhaustive: true`, i.e. the scraped list *is* the complete set of sections (a full course
   * curriculum, an entire ToC). This is the same flag the Sections editor's "Exhaustive" checkbox
   * sets, and it enables sections-derived Progress (`recomputeDerivedProgress` only counts leaves
   * when the source Sections value is exhaustive). Unset = the stored value's flag is preserved
   * (`false` for a first fill), matching today's behavior.
   */
              | { kind: "sections";
                propertyId: string;
                entryType: SectionFillEntryType;
                container?: string;
                header?: string;
                itemName?: string;
                itemUrl?: string;
                resolveItemUrl?: boolean;
                nameParts?: SectionNamePart[];
                namePartSeparator?: string;
                sectionMatch?: TextMatch;
                sectionHeaderSelector?: string;
                exhaustive?: boolean; };

/**
 * Entry types a `sections` fill target can build. `timestamp` is parsed from a text block; `name`
 * captures a plain titled list with no positional value (`startValue` stays `""`) — the item's name
 * comes from `itemName`/its own text, so no value selector or transform is needed.
 */
export type SectionFillEntryType = "name" | "url" | "page" | "timestamp";

/**
 * One component of a composed section-item name (see the `sections` target's `nameParts`). Each part
 * resolves a value from within the repeated item element and the parts are concatenated (joined by the
 * target's `namePartSeparator`). Reuses the same {@link FillExtract} building blocks as the rule's main
 * extract, applied per part.
 */
export interface SectionNamePart {
  /** Relative `querySelector` within the item element; absent = the item element itself. */
  selector?: string;
  /** How the matched element's value is read (default trimmed `textContent`). */
  read?: FillExtract["read"];
  /** Narrows which element within the item is used (same semantics as a rule's extract filters). */
  filters?: FillFilter[];
  /** String transforms applied to this part's value, in order (incl. `affix` for literal glue). */
  transform?: FillTransform[];
}

/** How to extract a rule's value(s) from the page. */
export interface FillExtract {
  /**
   * Where extraction candidates come from. Absent = `"selector"` (back-compat with every stored
   * rule, which predates this field). `"meta"` reads a `<meta>` tag by {@link metaKey} instead —
   * matched against the tag's `name` / `property` / `itemprop` attribute, reading `content` by
   * default (e.g. `twitter:creator`, `og:book:author`).
   */
  source?: "selector" | "meta";
  /** `querySelectorAll` candidates. Required for the `selector` source (absent = `selector`). */
  selector?: string;
  /**
   * Meta-tag key matched against a `<meta>` tag's `name` / `property` / `itemprop` attribute.
   * Required for the `meta` source; the value read is the `content` attribute unless {@link read}
   * overrides it.
   */
  metaKey?: string;
  /** Applied in order, each narrows candidates. */
  filters?: FillFilter[];
  /**
   * CSS selectors whose matching **descendants** are removed from each matched element before its
   * **text** is read — so their text never pollutes the value (e.g. drop a nested "Read more" button
   * or a price badge inside a description). Selectors are relative to the matched element and applied
   * to a throwaway clone, so the live page is untouched. Only affects the default `text` read;
   * `attr` / `backgroundImage` reads and the `meta` source ignore it. Absent/empty = read the full
   * subtree text (today's behavior).
   */
  excludeSelectors?: string[];
  /**
   * Default trimmed `textContent` (or the `content` attribute for the `meta` source).
   * `backgroundImage` reads the element's **computed `background-image`** and pulls the first
   * `url(…)` out of it — how you grab an image painted via CSS rather than an `<img src>` (pair it
   * with an `image` / `taxonomyDirect` image target). `svg` serializes the matched **inline `<svg>`
   * element** (the element itself, or its first descendant `<svg>`) into a `data:image/svg+xml,…`
   * URI — how you grab a logo drawn as inline SVG markup with no `src` (also pair it with an image
   * target).
   */
  read?: { kind: "text" } | { kind: "attr";
    name: string; } | { kind: "backgroundImage" } | { kind: "svg" };
  /** String transforms applied in order. */
  transform?: FillTransform[];
  /** Taxonomy targets only: split one value into many. */
  split?: string;
}

/** Narrows extraction candidates found by `FillExtract.selector`. */
export type FillFilter
  = | { kind: "selfText";
    match: TextMatch; }
    | { kind: "siblingText";
      match: TextMatch; }
      | { kind: "ancestorText";
        match: TextMatch;
        maxDepth?: number; }
        | { kind: "closest";
          selector: string; }
          | { kind: "nth";
            index: number; }
  /** Removes candidates whose own trimmed text matches — the inverse of `selfText`. */
            | { kind: "exclude";
              match: TextMatch; }
  /**
   * Removes candidates that match a CSS selector (`el.matches`) — the structural sibling of `exclude`
   * (text). Drops a badge/label node picked up alongside the real items (e.g. a `.capitalize` "quiz"
   * chip beside a lesson name).
   */
              | { kind: "excludeSelector";
                selector: string; };

/** Text-matching mode shared by the text-based `FillFilter` variants. */
export interface TextMatch {
  mode: "equals" | "contains" | "regex";
  value: string;
  caseSensitive?: boolean;
}

/**
 * One rating level's page detector for a `customProperty` target in `ratingBound: "range"` mode. The
 * level counts as **present** when its effective selector matches at least one element and — if
 * {@link matchText} is set — that element's trimmed text matches it. The effective selector is this
 * detector's own {@link selector} when set, otherwise the target's shared `ratingSelector`; the match
 * mode (equals vs contains) and case-insensitivity come from the target's global `ratingMatchExact`,
 * not per level. The detected range spans `[min, max]` of the present levels.
 */
export interface RatingLevelDetector {
  level: number;
  /** Optional per-level selector; falls back to the target's shared `ratingSelector` when absent. */
  selector?: string;
  /** Text the matched element must satisfy (the editor defaults it to the level's label); absent = selector-only. */
  matchText?: string;
}

/** String transform applied to an extracted value, in the order listed on `FillExtract.transform`. */
export type FillTransform
  = | { kind: "regex";
    pattern: string;
    flags?: string;
    group?: number; }
  /** First numeric run, commas stripped. */
    | { kind: "number" }
  /**
   * Parse a human duration string ("77h 32m", "1y 2mo 6d 23h 34m 34s", "1.5h") into a total number
   * of seconds — the unit the built-in Runtime `duration` property stores. Over-range components
   * (e.g. "93m 93s") simply sum; year = 365 d and month = 30 d are calendar-approximate.
   */
    | { kind: "duration" }
  /**
   * Normalize a human date string into the canonical ISO shape a Date/Time property stores —
   * `"YYYY-MM-DD"`, or `"YYYY-MM"` when the day is absent (pair with a Date/Time property's
   * "allow month-only dates" option). Recognizes English month names in any order
   * ("June 2026", "June 21, 2026", "21 June 2026", "Jun 2026"), already-ISO values
   * ("2026-06-21" / "2026-06"), and numeric slash forms (US month-first "06/21/2026", year-first
   * "2026/06/21"). Yields `""` on no match or an out-of-range month/day.
   */
    | { kind: "date" }
    | { kind: "replace";
      pattern: string;
      flags?: string;
      replacement: string; }
      | { kind: "trim" }
  /** Uppercase the first character of the value (e.g. "hello world" → "Hello world"); the rest is
   * left as-is (not title-cased). No-op on an empty string. */
      | { kind: "capitalizeFirst" }
  /** Prepend `prefix` and/or append `suffix` literal text to the value (both optional). */
      | { kind: "affix";
        prefix?: string;
        suffix?: string; }
  /**
   * Resolve the value as a URL against the current page's URL (`new URL(value, pageUrl)`), turning a
   * relative `href` ("/books/123") or a protocol-relative one ("//host/path") into an absolute URL.
   * A no-op when the value is already absolute, unresolvable, or no page URL is available.
   */
        | { kind: "absoluteUrl" }
  /**
   * Turn a YouTube video reference into its thumbnail image URL
   * (`https://img.youtube.com/vi/<id>/hqdefault.jpg`) — how you grab an embedded video's cover (the
   * player's own thumbnail lives inside the cross-origin frame and can't be read directly). Tolerant
   * of a noisy value: it extracts the id from a clean URL, a URL buried anywhere inside the value
   * (JSON blob / `srcdoc` / escaped `href`), a `videoId`-style key, or a bare 11-char id — any
   * subdomain incl. `youtube-nocookie.com` (see `findYouTubeVideoId`). Passthrough — returns the value
   * unchanged — when it carries no YouTube reference.
   *
   * On lazy / facade embeds (Substack, "click to play", below-the-fold players) the live
   * `<iframe src>` is usually absent at fill time, so `iframe[src*="youtube"]` matches nothing. Point
   * the rule at the reachable attribute instead — e.g. selector `iframe[data-src*="youtube"]` reading
   * `data-src`, a `[data-attrs*="videoId"]` element reading `data-attrs`, or an `<a href*="youtu">`
   * reading `href` — then this transform digs the id out.
   */
        | { kind: "youtubeThumbnail" };

/** Compact option shown in the popup's taxonomy match list. */
export interface ExtensionFillTaxonomyOption {
  id: string;
  name: string;
}

/**
 * Response of `GET /api/extension/fill-context` — tells the browser extension popup whether the
 * current tab's URL is an existing bookmark it can offer to fill from the live page, is a taxonomy
 * entity's source page it can offer to fill (`taxonomyDirect` rules, no bookmark), is already pending
 * in the Inbox, or hasn't been seen. `website`/`properties`/`taxonomies` are populated only when
 * `mode === "bookmark"` (or `"taxonomy"`) and the matched website has configured extension fill rules.
 */
export interface ExtensionFillContext {
  mode: "bookmark" | "taxonomy" | "inbox" | "unknown";
  /** Present iff `mode === "bookmark"`. */
  bookmark?: Bookmark;
  /**
   * The pending import-item id backing this URL's Inbox entry. Present iff `mode === "inbox"`, so
   * the popup can promote it to a bookmark via `POST /api/imports/items/:id/approve` (the
   * "Move to Bookmarks" affordance) without re-querying the Inbox.
   */
  inboxItemId?: string;
  website?: {
    id: string;
    siteName: string;
    extensionFillRules: WebsiteExtensionFillRule[];
    /** Groups over the site's rules, so the popup can render grouped rows under collapsible headers. */
    extensionFillRuleGroups?: ExtensionFillRuleGroup[];
  };
  /**
   * Custom properties referenced by the website's rules (both `customProperty` and `sections`
   * targets); file/image-typed properties excluded.
   */
  properties?: CustomProperty[];
  /** Compact `{id, name}` lists, only for taxonomies referenced by the website's rules. */
  taxonomies?: {
    people?: ExtensionFillTaxonomyOption[];
    groups?: ExtensionFillTaxonomyOption[];
    locations?: ExtensionFillTaxonomyOption[];
    tags?: ExtensionFillTaxonomyOption[];
  };
  /**
   * The terms available to update for each referenced `association`, each carrying the current values
   * of the writable fields — so the popup can show current → extracted, auto-target a single term (or
   * let the user pick among several), and upsert a social link without wiping the term's other
   * platforms. Populated from two sources: a `taxonomyEntity` rule's bookmark-linked terms
   * (`mode === "bookmark"`), and a `taxonomyDirect` rule's URL-resolved entity (`mode === "taxonomy"`,
   * or folded into a bookmark visit) — see `services/extensionFill.ts`. `taxonomyDirect` `match`-mode
   * associations are absent (resolved in-browser).
   */
  associatedTerms?: Partial<Record<TaxonomyEntityAssociation, TaxonomyEntityTermRef[]>>;
  /**
   * Compact `{id, name}` option lists for the related taxonomies referenced by a `relation:<key>`
   * target, so the popup can match an extracted name to an id (websites' `name` is the site name).
   * Only referenced relations are populated.
   */
  relationOptions?: {
    groups?: ExtensionFillTaxonomyOption[];
    websites?: ExtensionFillTaxonomyOption[];
    youtubeChannels?: ExtensionFillTaxonomyOption[];
  };
  /**
   * All languages (for match-or-create by `isoCode`), present when any `language` target is
   * configured. Paired with {@link primaryLanguageLevelId}.
   */
  languages?: { id: string;
    name: string;
    isoCode: string | null; }[];
  /**
   * The availability-kind "Primary Language" usage-level id used by a `language` target, or `null`
   * when no such level exists (the popup then renders those rows disabled with a clear reason).
   * Present when any `language` target is configured.
   */
  primaryLanguageLevelId?: string | null;
}

/**
 * Which of a bookmark's fields are currently FILLED (non-empty). Consumed by
 * {@link websiteRulesCanFill} to decide whether a website's extension-fill rule has an empty bookmark
 * field left to offer. Built from either a fully-hydrated {@link Bookmark} (see
 * {@link bookmarkFillPresence}) or, server-side, the middleware's grouped condition-input batches —
 * the flat shape lets both callers share the "which target kinds count" logic below.
 */
export interface BookmarkFillPresence {
  title: boolean;
  description: boolean;
  isbn: boolean;
  year: boolean;
  image: boolean;
  people: boolean;
  groups: boolean;
  locations: boolean;
  tags: boolean;
  /** Custom-property ids (non-sections) that carry a stored value. */
  filledPropertyIds: Set<string>;
  /** Sections-property ids that carry a non-empty value. */
  filledSectionsPropertyIds: Set<string>;
}

/** Whether a single fill target points at an empty bookmark field (linked-entity kinds never do). */
function fillTargetIsEmpty(target: FillTarget, presence: BookmarkFillPresence): boolean {
  switch (target.kind) {
    case "field":
      return !presence[target.field];
    case "customProperty":
      return !presence.filledPropertyIds.has(target.propertyId);
    case "sections":
      return !presence.filledSectionsPropertyIds.has(target.propertyId);
    case "taxonomy":
      return !presence[target.taxonomy];
    case "image":
      return !presence.image;
    // Written into a LINKED taxonomy entity, not the bookmark — never counts as a fillable bookmark field.
    case "taxonomyEntity":
    case "taxonomyDirect":
      return false;
  }
}

/**
 * Whether ≥1 of a website's extension-fill rules targets a BOOKMARK field that is currently empty on
 * the bookmark — i.e. the rule could actually fill something. `taxonomyEntity`/`taxonomyDirect` rules
 * write into linked taxonomy entities (not the bookmark) and are ignored. An empty rule list — or one
 * whose bookmark-field targets are all already filled — yields `false`.
 */
export function websiteRulesCanFill(
  rules: WebsiteExtensionFillRule[],
  presence: BookmarkFillPresence,
): boolean {
  return rules.some(rule => fillTargetIsEmpty(rule.target, presence));
}

/**
 * Whether a single fill target points at a BOOKMARK field at all — regardless of whether that field
 * is currently filled. This is the presence-independent partition mirrored by the `return false` arms
 * of {@link fillTargetIsEmpty}: `taxonomyEntity`/`taxonomyDirect` write into a linked taxonomy entity
 * (not the bookmark) and so are never a fillable bookmark field.
 */
function fillTargetIsBookmarkField(target: FillTarget): boolean {
  switch (target.kind) {
    case "field":
    case "customProperty":
    case "sections":
    case "taxonomy":
    case "image":
      return true;
    case "taxonomyEntity":
    case "taxonomyDirect":
      return false;
  }
}

/**
 * Whether ≥1 of a website's extension-fill rules targets a BOOKMARK field — regardless of whether
 * those fields are currently filled. The presence-independent sibling of {@link websiteRulesCanFill}:
 * it answers "does this website have fillable fields at all", not "is there something left to fill".
 * An empty rule list, or one whose only targets are linked-entity kinds, yields `false`.
 */
export function websiteRulesHaveFillableField(rules: WebsiteExtensionFillRule[]): boolean {
  return rules.some(rule => fillTargetIsBookmarkField(rule.target));
}

/**
 * Build a {@link BookmarkFillPresence} from a fully-hydrated bookmark. A custom property counts as
 * filled when any of its value collections carries it (choices/sections/text require a non-empty
 * value); `year` is present when non-null; scalars and `image` follow their own emptiness.
 */
export function bookmarkFillPresence(bookmark: Bookmark): BookmarkFillPresence {
  const filledPropertyIds = new Set<string>();
  for (const v of bookmark.numberValues) filledPropertyIds.add(v.propertyId);
  for (const v of bookmark.booleanValues) filledPropertyIds.add(v.propertyId);
  for (const v of bookmark.dateTimeValues) filledPropertyIds.add(v.propertyId);
  for (const v of bookmark.fileValues) filledPropertyIds.add(v.propertyId);
  for (const v of bookmark.progressValues) filledPropertyIds.add(v.propertyId);
  for (const v of bookmark.choicesValues) if (v.values.length > 0) filledPropertyIds.add(v.propertyId);
  for (const v of bookmark.textValues) if (v.value.trim() !== "") filledPropertyIds.add(v.propertyId);
  const filledSectionsPropertyIds = new Set<string>();
  for (const v of bookmark.sectionsValues) if (v.sections.length > 0) filledSectionsPropertyIds.add(v.propertyId);
  return {
    title: (bookmark.title ?? "").trim() !== "",
    description: (bookmark.description ?? "").trim() !== "",
    isbn: (bookmark.isbn ?? "").trim() !== "",
    year: bookmark.year != null,
    image: bookmark.image != null,
    people: bookmark.people.length > 0,
    groups: bookmark.groups.length > 0,
    locations: bookmark.locations.length > 0,
    tags: bookmark.tags.length > 0,
    filledPropertyIds,
    filledSectionsPropertyIds,
  };
}
