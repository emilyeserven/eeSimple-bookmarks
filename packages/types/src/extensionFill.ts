/**
 * Per-website extraction rules for the browser extension's "check & fill" mode: when the current
 * tab's URL matches an existing bookmark, these rules drive scraping the live page for field /
 * custom-property / taxonomy values to offer back to the user (part of #1239). Stored as nullable
 * jsonb on `websites.extension_fill_rules`.
 */

import type { TaxonomyEntityAssociation, TaxonomyEntityFieldKey, TaxonomyEntityTermRef } from "./extensionFillTaxonomy.js";
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
}

/** What a rule's extracted value(s) are applied to. */
export type FillTarget
  = | { kind: "field";
    field: "title" | "description" | "isbn" | "year"; }
  /**
   * Value kind is derived from the property's type; file/image-typed custom *properties* are
   * excluded (grab an image via the dedicated `image` target below). For a multi-value property the
   * rule fills one specific sub-value: `subField` picks the number of a Two-Numbers (`itemInItems`)
   * property; `choiceValue` picks the option of a `choices` property.
   */
    | { kind: "customProperty";
      propertyId: string;
      subField?: "current" | "total";
      choiceValue?: string; }
  /** Multi-value; unmatched names create a name-only stub. */
      | { kind: "taxonomy";
        taxonomy: "people" | "groups" | "locations" | "tags"; }
  /**
   * Resolve the extracted value (a publisher name) to a Group via match-or-create and set the
   * bookmark's **singular** publisher (`groupId`) — the single-valued sibling of `taxonomy: "groups"`
   * (which fills the *plural* creator `groupIds`). E.g. `<meta name="publisher">` → the publishing
   * house. Unmatched names create a name-only Group stub.
   */
        | { kind: "publisher" }
  /**
   * Grab an image URL off the page (typically an `<img>`'s `src` via `read: {kind:"attr"}`); the
   * extension downloads the bytes in the browser and uploads them to the bookmark. `setMain` makes
   * the grabbed image the bookmark's main/primary image (defaults to true in the editor).
   */
        | { kind: "image";
          setMain?: boolean; }
  /**
   * Write the extracted value into a fixed field of a taxonomy term the bookmark is **linked to**
   * (not the bookmark itself) — e.g. put `@OReillyMedia` into the publisher Group's X social link.
   * `association` selects which linked taxonomy provides the term(s); when the bookmark links to
   * exactly one term the popup targets it automatically, otherwise it lets the user pick one.
   * `field` is one of that entity's writable fields (see {@link TAXONOMY_ENTITY_SPECS});
   * `socialPlatform` is required when `field === "socialLink"`.
   */
          | { kind: "taxonomyEntity";
            association: TaxonomyEntityAssociation;
            field: TaxonomyEntityFieldKey;
            socialPlatform?: SocialMediaPlatform; };

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
  /** Default trimmed `textContent` (or the `content` attribute for the `meta` source). */
  read?: { kind: "text" } | { kind: "attr";
    name: string; };
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
            index: number; };

/** Text-matching mode shared by the text-based `FillFilter` variants. */
export interface TextMatch {
  mode: "equals" | "contains" | "regex";
  value: string;
  caseSensitive?: boolean;
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
      | { kind: "trim" };

/** Compact option shown in the popup's taxonomy match list. */
export interface ExtensionFillTaxonomyOption {
  id: string;
  name: string;
}

/**
 * Response of `GET /api/extension/fill-context` — tells the browser extension popup whether the
 * current tab's URL is an existing bookmark it can offer to fill from the live page, is already
 * pending in the Inbox, or hasn't been seen. `website`/`properties`/`taxonomies` are populated only
 * when `mode === "bookmark"` and the matched website has configured extension fill rules.
 */
export interface ExtensionFillContext {
  mode: "bookmark" | "inbox" | "unknown";
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
  };
  /** Custom properties referenced by the website's rules; file/image-typed properties excluded. */
  properties?: CustomProperty[];
  /** Compact `{id, name}` lists, only for taxonomies referenced by the website's rules. */
  taxonomies?: {
    people?: ExtensionFillTaxonomyOption[];
    groups?: ExtensionFillTaxonomyOption[];
    locations?: ExtensionFillTaxonomyOption[];
    tags?: ExtensionFillTaxonomyOption[];
  };
  /**
   * The bookmark's currently-linked terms for each `association` referenced by a `taxonomyEntity`
   * rule, each carrying the current values of the writable fields — so the popup can show
   * current → extracted, auto-target a single linked term (or let the user pick among several), and
   * upsert a social link without wiping the term's other platforms.
   */
  associatedTerms?: Partial<Record<TaxonomyEntityAssociation, TaxonomyEntityTermRef[]>>;
}
