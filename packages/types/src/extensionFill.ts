/**
 * Per-website extraction rules for the browser extension's "check & fill" mode: when the current
 * tab's URL matches an existing bookmark, these rules drive scraping the live page for field /
 * custom-property / taxonomy values to offer back to the user (part of #1239). Stored as nullable
 * jsonb on `websites.extension_fill_rules`.
 */

/** One configured extraction rule for a website. */
export interface WebsiteExtensionFillRule {
  /** Stable uuid — checkbox + editor list identity. */
  id: string;
  /** Shown in the popup row + editor, e.g. "Print length". */
  label: string;
  /** Optional path gate; `WebsiteParamRule.pathSuffix` semantics. */
  pathSuffix?: string;
  target: FillTarget;
  extract: FillExtract;
}

/** What a rule's extracted value(s) are applied to. */
export type FillTarget
  = | { kind: "field";
    field: "title" | "description" | "isbn" | "year"; }
  /** Value kind is derived from the property's type; file/image properties are excluded. */
    | { kind: "customProperty";
      propertyId: string; }
  /** Multi-value; unmatched names create a name-only stub. */
      | { kind: "taxonomy";
        taxonomy: "people" | "groups" | "locations" | "tags"; };

/** How to extract a rule's value(s) from the page. */
export interface FillExtract {
  /** `querySelectorAll` candidates. */
  selector: string;
  /** Applied in order, each narrows candidates. */
  filters?: FillFilter[];
  /** Default trimmed `textContent`. */
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
    | { kind: "replace";
      pattern: string;
      flags?: string;
      replacement: string; }
      | { kind: "trim" };
