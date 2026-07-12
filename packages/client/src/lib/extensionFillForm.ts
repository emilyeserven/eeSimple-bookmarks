import type {
  CustomProperty,
  EntityResolution,
  FillExtract,
  FillFilter,
  FillTarget,
  FillTransform,
  PathMatch,
  TaxonomyDirectFieldKey,
  TaxonomyEntityAssociation,
  TaxonomyEntityAssociationSpec,
  TaxonomyEntityFieldKey,
  TaxonomyEntityRelationKey,
  TaxonomyEntityWriteKey,
  TextMatch,
  WebsiteExtensionFillRule,
} from "@eesimple/types";

import {
  SOCIAL_MEDIA_PLATFORM_LABELS,
  TAXONOMY_ENTITY_FIELD_LABELS,
  TAXONOMY_ENTITY_RELATION_LABELS,
  TAXONOMY_ENTITY_SPECS,
} from "@eesimple/types";

import { randomId } from "./utils";

/**
 * Editor-state helpers for the Website "Extension Fill" rules editor (#1244). The editor holds the
 * stored {@link WebsiteExtensionFillRule} shape directly as draft state; these pure helpers build
 * blank drafts, coerce a variant when its `kind` select changes (keeping only that variant's fields),
 * and — most importantly — {@link normalizeExtensionFillRules} serialize the drafts into a
 * **schema-clean** payload. The middleware body schema is `additionalProperties: false` at every
 * level (see `routes/websites.ts`), so a stray field from a previously-selected variant, or an
 * incomplete rule, would 400; normalize drops those before the auto-save PATCH.
 */

// ---------------------------------------------------------------------------
// Blank drafts / defaults
// ---------------------------------------------------------------------------

/** A blank text match for the text-based filter variants. */
export function newTextMatch(): TextMatch {
  return {
    mode: "contains",
    value: "",
  };
}

/** A blank path-match gate — defaults to `prefix` (the natural fit for `/course/` vs `/library/view/`). */
export function newPathMatch(): PathMatch {
  return {
    mode: "prefix",
    value: "",
  };
}

/** A blank extraction rule with a stable id (secure-context-safe), default field target + selector. */
export function newFillRuleDraft(): WebsiteExtensionFillRule {
  return {
    id: randomId(),
    label: "",
    target: {
      kind: "field",
      field: "title",
    },
    extract: {
      selector: "",
    },
  };
}

/** Deep-clone an existing rule with a fresh id, for the editor's "duplicate" action. */
export function duplicateFillRule(rule: WebsiteExtensionFillRule): WebsiteExtensionFillRule {
  const clone = JSON.parse(JSON.stringify(rule)) as WebsiteExtensionFillRule;
  return {
    ...clone,
    id: randomId(),
  };
}

/** A blank filter row (a self-text "contains" match). */
export function newFillFilter(): FillFilter {
  return {
    kind: "selfText",
    match: newTextMatch(),
  };
}

/** A blank transform row (numeric extraction — the most common case). */
export function newFillTransform(): FillTransform {
  return {
    kind: "number",
  };
}

// ---------------------------------------------------------------------------
// Collapsed-preview summary
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<Extract<FillTarget, { kind: "field" }>["field"], string> = {
  title: "Title",
  description: "Description",
  isbn: "ISBN",
  year: "Year",
};

const TAXONOMY_LABELS: Record<Extract<FillTarget, { kind: "taxonomy" }>["taxonomy"], string> = {
  people: "People",
  groups: "Groups",
  locations: "Locations",
  tags: "Tags",
};

/**
 * Every legal `taxonomyEntity` write-key for an association: its scalar fields, its relation targets
 * (`relation:<key>`), and — when it's a language-usage owner — `language`. Drives the editor's Field
 * dropdown and the association-switch keep-field logic.
 */
export function taxonomyEntityWriteKeys(
  association: TaxonomyEntityAssociation,
): TaxonomyEntityWriteKey[] {
  const spec: TaxonomyEntityAssociationSpec = TAXONOMY_ENTITY_SPECS[association];
  return [
    ...spec.fields,
    ...(spec.relations ?? []).map(relation => `relation:${relation.key}` as const),
    ...(spec.languageOwnerType ? (["language"] as const) : []),
  ];
}

/** Raw (un-i18n'd) label for a `taxonomyEntity` write-key — scalar field, relation, or language. */
export function taxonomyEntityFieldLabel(field: TaxonomyEntityWriteKey): string {
  if (field === "language") return "Primary language";
  if (field.startsWith("relation:")) {
    const key = field.slice("relation:".length) as TaxonomyEntityRelationKey;
    return TAXONOMY_ENTITY_RELATION_LABELS[key];
  }
  return TAXONOMY_ENTITY_FIELD_LABELS[field as TaxonomyEntityFieldKey];
}

/**
 * A short human summary of a rule's target for the collapsed rule card. Resolves the custom-property
 * name (and the chosen sub-value) from `property` when available.
 */
export function describeFillTarget(target: FillTarget, property?: CustomProperty): string {
  switch (target.kind) {
    case "field":
      return FIELD_LABELS[target.field];
    case "taxonomy":
      return TAXONOMY_LABELS[target.taxonomy];
    case "customProperty": {
      const name = property?.name ?? "Custom property";
      if (target.subField) return `${name} · ${target.subField === "current" ? "Current" : "Total"}`;
      if (target.choiceValue) {
        const option = property?.choicesItems.find(item => item.value === target.choiceValue);
        return `${name} · ${option?.label ?? target.choiceValue}`;
      }
      return name;
    }
    case "image":
      return target.setMain ? "Image · Main" : "Image";
    case "taxonomyEntity": {
      const assoc = TAXONOMY_ENTITY_SPECS[target.association].label;
      const fieldLabel = target.field === "socialLink" && target.socialPlatform
        ? SOCIAL_MEDIA_PLATFORM_LABELS[target.socialPlatform]
        : taxonomyEntityFieldLabel(target.field);
      return `${assoc} · ${fieldLabel}`;
    }
    case "taxonomyDirect": {
      const assoc = TAXONOMY_ENTITY_SPECS[target.association].label;
      const fieldLabel = target.field === "socialLink" && target.socialPlatform
        ? SOCIAL_MEDIA_PLATFORM_LABELS[target.socialPlatform]
        : TAXONOMY_ENTITY_FIELD_LABELS[target.field];
      const source = target.resolve.mode === "url" ? "from URL" : "from page";
      return `${assoc} · ${fieldLabel} (${source})`;
    }
    case "sections": {
      const name = property?.name ?? "Sections";
      const grouped = target.sectionMatch?.value.trim() ? " · grouped" : "";
      return `${name} · ${SECTION_FILL_ENTRY_TYPE_LABELS[target.entryType]}${grouped}`;
    }
  }
}

/** Human labels for the `sections` target's entry types. */
export const SECTION_FILL_ENTRY_TYPE_LABELS: Record<
  Extract<FillTarget, { kind: "sections" }>["entryType"],
  string
> = {
  url: "URL",
  page: "Page",
  timestamp: "Timestamp",
};

// ---------------------------------------------------------------------------
// Read-only detail summaries (mirror describeFillTarget; plain English, no i18n)
// ---------------------------------------------------------------------------

const PATH_MATCH_MODE_LABELS: Record<PathMatch["mode"], string> = {
  prefix: "Starts with",
  contains: "Contains",
  suffix: "Ends with",
  regex: "Matches regex",
};

/** A short summary of a rule's path gate for the read-only view, e.g. `Starts with "/course/"`. */
export function describePathMatch(pathMatch: PathMatch): string {
  return `${PATH_MATCH_MODE_LABELS[pathMatch.mode]} "${pathMatch.value}"`;
}

/** A short summary of how the value is read: an attribute, a CSS background image, or trimmed text. */
export function describeFillRead(read: FillExtract["read"]): string {
  if (read?.kind === "attr" && read.name) return `Attribute: ${read.name}`;
  if (read?.kind === "backgroundImage") return "Background image URL";
  return "Text content";
}

const TEXT_MATCH_MODE_LABELS: Record<TextMatch["mode"], string> = {
  equals: "equals",
  contains: "contains",
  regex: "matches",
};

/** A short summary of a text match, e.g. `contains "PRINT LENGTH:"` (+ a case-sensitivity note). */
function describeTextMatch(match: TextMatch): string {
  const base = `${TEXT_MATCH_MODE_LABELS[match.mode]} "${match.value}"`;
  return match.caseSensitive ? `${base} (case-sensitive)` : base;
}

/** A short summary of one extraction filter for the read-only view. */
export function describeFillFilter(filter: FillFilter): string {
  switch (filter.kind) {
    case "selfText":
      return `Self text ${describeTextMatch(filter.match)}`;
    case "siblingText":
      return `Sibling text ${describeTextMatch(filter.match)}`;
    case "ancestorText":
      return `Ancestor text ${describeTextMatch(filter.match)}${
        filter.maxDepth !== undefined ? ` (max depth ${filter.maxDepth})` : ""
      }`;
    case "closest":
      return `Closest ancestor "${filter.selector}"`;
    case "nth":
      return `Nth match #${filter.index}`;
  }
}

/** A short summary of one string transform for the read-only view. */
export function describeFillTransform(transform: FillTransform): string {
  switch (transform.kind) {
    case "regex":
      return `Regex /${transform.pattern}/${transform.flags ?? ""}${
        transform.group !== undefined ? ` group ${transform.group}` : ""
      }`;
    case "number":
      return "First number";
    case "duration":
      return "Duration → seconds";
    case "date":
      return "Date → YYYY-MM-DD";
    case "replace":
      return `Replace /${transform.pattern}/${transform.flags ?? ""} → "${transform.replacement}"`;
    case "trim":
      return "Trim";
    case "affix":
      return [
        transform.prefix ? `Prefix "${transform.prefix}"` : "",
        transform.suffix ? `Suffix "${transform.suffix}"` : "",
      ].filter(Boolean).join(" + ") || "Affix";
    case "absoluteUrl":
      return "Resolve relative URL";
    case "youtubeThumbnail":
      return "YouTube thumbnail";
  }
}

// ---------------------------------------------------------------------------
// Kind-change coercion (rebuild a variant keeping only its own fields)
// ---------------------------------------------------------------------------

/**
 * Whether a `taxonomyDirect` target's `field` is valid for its association — a JSON field the update
 * route accepts, or `image` when the entity has an image-upload endpoint (`spec.image`). Shared by the
 * coercion (reset the field on an unsupported association) and the cleaner (drop an invalid rule).
 */
export function directFieldSupported(
  association: TaxonomyEntityAssociation,
  field: TaxonomyDirectFieldKey,
): boolean {
  const spec: TaxonomyEntityAssociationSpec = TAXONOMY_ENTITY_SPECS[association];
  return field === "image" ? spec.image === true : (spec.fields as string[]).includes(field);
}

/** Rebuild a `customProperty` target, preserving the property id + per-value discriminators. */
function coerceCustomPropertyTarget(prev: FillTarget): Extract<FillTarget, { kind: "customProperty" }> {
  const same = prev.kind === "customProperty" ? prev : null;
  return {
    kind: "customProperty",
    propertyId: same ? same.propertyId : "",
    // Preserve the per-value discriminators across a same-kind rebuild (e.g. a property swap).
    ...(same?.subField !== undefined
      ? {
        subField: same.subField,
      }
      : {}),
    ...(same?.choiceValue !== undefined
      ? {
        choiceValue: same.choiceValue,
      }
      : {}),
  };
}

/** Rebuild a `taxonomyEntity` target, preserving association/field/socialPlatform where same-kind. */
function coerceTaxonomyEntityTarget(prev: FillTarget): Extract<FillTarget, { kind: "taxonomyEntity" }> {
  const same = prev.kind === "taxonomyEntity" ? prev : null;
  return {
    kind: "taxonomyEntity",
    association: same ? same.association : "website",
    field: same ? same.field : "name",
    ...(same?.socialPlatform !== undefined
      ? {
        socialPlatform: same.socialPlatform,
      }
      : {}),
  };
}

/** Rebuild a `taxonomyDirect` target, keeping the field only if the association still supports it. */
function coerceTaxonomyDirectTarget(prev: FillTarget): Extract<FillTarget, { kind: "taxonomyDirect" }> {
  const same = prev.kind === "taxonomyDirect" ? prev : null;
  const association = same ? same.association : "website";
  const prevField = same ? same.field : "name";
  // Keep the field only if the (possibly new) association still supports it, else its first field.
  const field = directFieldSupported(association, prevField)
    ? prevField
    : TAXONOMY_ENTITY_SPECS[association].fields[0];
  return {
    kind: "taxonomyDirect",
    association,
    resolve: same
      ? same.resolve
      : {
        mode: "url",
      },
    field,
    ...(same?.socialPlatform !== undefined
      ? {
        socialPlatform: same.socialPlatform,
      }
      : {}),
  };
}

/** Rebuild a target for a newly-selected `kind`, preserving a same-kind value where possible. */
export function coerceFillTarget(kind: FillTarget["kind"], prev: FillTarget): FillTarget {
  switch (kind) {
    case "field":
      return {
        kind: "field",
        field: prev.kind === "field" ? prev.field : "title",
      };
    case "customProperty":
      return coerceCustomPropertyTarget(prev);
    case "taxonomy":
      return {
        kind: "taxonomy",
        taxonomy: prev.kind === "taxonomy" ? prev.taxonomy : "people",
      };
    case "image":
      return {
        kind: "image",
        setMain: prev.kind === "image" ? prev.setMain : true,
      };
    case "taxonomyEntity":
      return coerceTaxonomyEntityTarget(prev);
    case "taxonomyDirect":
      return coerceTaxonomyDirectTarget(prev);
    case "sections":
      return coerceSectionsTarget(prev);
  }
}

/**
 * Rebuild a `sections` target from a previous target. A same-kind rebuild preserves the property /
 * entry type / sub-selectors (the rest-spread carries only the keys that were set); a switch from a
 * different kind starts blank.
 */
function coerceSectionsTarget(prev: FillTarget): Extract<FillTarget, { kind: "sections" }> {
  if (prev.kind !== "sections") {
    return {
      kind: "sections",
      propertyId: "",
      entryType: "url",
    };
  }
  const {
    kind: _kind, ...rest
  } = prev;
  return {
    kind: "sections",
    ...rest,
  };
}

/** Rebuild a filter for a newly-selected `kind`, preserving the text match across text variants. */
export function coerceFillFilter(kind: FillFilter["kind"], prev: FillFilter): FillFilter {
  const match = "match" in prev ? prev.match : newTextMatch();
  switch (kind) {
    case "selfText":
      return {
        kind: "selfText",
        match,
      };
    case "siblingText":
      return {
        kind: "siblingText",
        match,
      };
    case "ancestorText":
      return {
        kind: "ancestorText",
        match,
      };
    case "closest":
      return {
        kind: "closest",
        selector: prev.kind === "closest" ? prev.selector : "",
      };
    case "nth":
      return {
        kind: "nth",
        index: prev.kind === "nth" ? prev.index : 0,
      };
  }
}

/** Rebuild a transform for a newly-selected `kind`, preserving the pattern across regex/replace. */
export function coerceFillTransform(kind: FillTransform["kind"], prev: FillTransform): FillTransform {
  const pattern = prev.kind === "regex" || prev.kind === "replace" ? prev.pattern : "";
  switch (kind) {
    case "regex":
      return {
        kind: "regex",
        pattern,
      };
    case "replace":
      return {
        kind: "replace",
        pattern,
        replacement: "",
      };
    case "number":
      return {
        kind: "number",
      };
    case "duration":
      return {
        kind: "duration",
      };
    case "date":
      return {
        kind: "date",
      };
    case "trim":
      return {
        kind: "trim",
      };
    case "affix":
      return {
        kind: "affix",
      };
    case "absoluteUrl":
      return {
        kind: "absoluteUrl",
      };
    case "youtubeThumbnail":
      return {
        kind: "youtubeThumbnail",
      };
  }
}

// ---------------------------------------------------------------------------
// Immutable list reorder
// ---------------------------------------------------------------------------

/** Move `arr[from]` to index `to`, returning the original array when `to` is out of range. */
export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// ---------------------------------------------------------------------------
// Schema-clean serialization
// ---------------------------------------------------------------------------

/** Clean a path-match gate; a blank value makes the gate meaningless, so drop it (`null`). */
function cleanPathMatch(pathMatch: PathMatch): PathMatch | null {
  const value = pathMatch.value.trim();
  if (!value) return null;
  return {
    mode: pathMatch.mode,
    value,
  };
}

/** Keep only `mode`/`value`, and `caseSensitive` only when true (omit the redundant default). */
function cleanTextMatch(match: TextMatch): TextMatch {
  return {
    mode: match.mode,
    value: match.value,
    ...(match.caseSensitive
      ? {
        caseSensitive: true,
      }
      : {}),
  };
}

/** Clean a `customProperty` target; no selected property is incomplete (`null`). */
function cleanCustomPropertyTarget(
  target: Extract<FillTarget, { kind: "customProperty" }>,
): FillTarget | null {
  if (!target.propertyId) return null;
  return {
    kind: "customProperty",
    propertyId: target.propertyId,
    ...(target.subField !== undefined
      ? {
        subField: target.subField,
      }
      : {}),
    ...(target.choiceValue
      ? {
        choiceValue: target.choiceValue,
      }
      : {}),
  };
}

/** Clean a `taxonomyEntity` target; a social-link with no chosen platform is incomplete (`null`). */
function cleanTaxonomyEntityTarget(
  target: Extract<FillTarget, { kind: "taxonomyEntity" }>,
): FillTarget | null {
  if (target.field === "socialLink" && !target.socialPlatform) return null;
  return {
    kind: "taxonomyEntity",
    association: target.association,
    field: target.field,
    ...(target.field === "socialLink" && target.socialPlatform
      ? {
        socialPlatform: target.socialPlatform,
      }
      : {}),
  };
}

/**
 * Clean a `taxonomyDirect` target. Drops the rule when incomplete: a field the association doesn't
 * support (incl. image on a non-image entity), a social link with no platform, or a `match` resolver
 * with no usable extract.
 */
function cleanTaxonomyDirectTarget(
  target: Extract<FillTarget, { kind: "taxonomyDirect" }>,
): FillTarget | null {
  if (!directFieldSupported(target.association, target.field)) return null;
  if (target.field === "socialLink" && !target.socialPlatform) return null;
  let resolve: EntityResolution;
  if (target.resolve.mode === "match") {
    const select = cleanExtract(target.resolve.select, false);
    if (!select) return null;
    resolve = {
      mode: "match",
      select,
    };
  }
  else {
    resolve = {
      mode: "url",
    };
  }
  return {
    kind: "taxonomyDirect",
    association: target.association,
    resolve,
    field: target.field,
    ...(target.field === "socialLink" && target.socialPlatform
      ? {
        socialPlatform: target.socialPlatform,
      }
      : {}),
  };
}

/**
 * Clean a `sections` target; no selected property is incomplete. Keep sub-selectors only when
 * non-blank, and enforce a single grouping mode: a non-blank text match (`sectionMatch`) drops
 * `container`/`header` (text grouping wins, as the engine's precedence does), so the saved target is
 * never the self-contradictory "container + text match" the editor's mode switch already prevents.
 */
function cleanSectionsTarget(
  target: Extract<FillTarget, { kind: "sections" }>,
): FillTarget | null {
  if (!target.propertyId) return null;
  const itemName = target.itemName?.trim();
  const itemUrl = target.itemUrl?.trim();
  const sectionMatch = target.sectionMatch?.value.trim()
    ? target.sectionMatch
    : undefined;
  // Text grouping and container grouping are mutually exclusive; text match wins.
  const container = sectionMatch ? undefined : target.container?.trim();
  const header = sectionMatch ? undefined : target.header?.trim();
  return {
    kind: "sections",
    propertyId: target.propertyId,
    entryType: target.entryType,
    ...(container
      ? {
        container,
      }
      : {}),
    ...(header
      ? {
        header,
      }
      : {}),
    ...(itemName
      ? {
        itemName,
      }
      : {}),
    ...(itemUrl
      ? {
        itemUrl,
      }
      : {}),
    ...(sectionMatch
      ? {
        sectionMatch,
      }
      : {}),
  };
}

/** Clean one target; a `customProperty` with no selected property is incomplete (`null`). */
function cleanTarget(target: FillTarget): FillTarget | null {
  switch (target.kind) {
    case "field":
      return {
        kind: "field",
        field: target.field,
      };
    case "customProperty":
      return cleanCustomPropertyTarget(target);
    case "taxonomy":
      return {
        kind: "taxonomy",
        taxonomy: target.taxonomy,
      };
    case "image":
      return {
        kind: "image",
        ...(target.setMain
          ? {
            setMain: true,
          }
          : {}),
      };
    case "taxonomyEntity":
      return cleanTaxonomyEntityTarget(target);
    case "taxonomyDirect":
      return cleanTaxonomyDirectTarget(target);
    case "sections":
      return cleanSectionsTarget(target);
  }
}

/** Clean one filter; a `closest` with a blank selector is dropped (`null`). */
function cleanFilter(filter: FillFilter): FillFilter | null {
  switch (filter.kind) {
    case "selfText":
      return {
        kind: "selfText",
        match: cleanTextMatch(filter.match),
      };
    case "siblingText":
      return {
        kind: "siblingText",
        match: cleanTextMatch(filter.match),
      };
    case "ancestorText":
      return {
        kind: "ancestorText",
        match: cleanTextMatch(filter.match),
        ...(filter.maxDepth !== undefined
          ? {
            maxDepth: filter.maxDepth,
          }
          : {}),
      };
    case "closest":
      return filter.selector.trim()
        ? {
          kind: "closest",
          selector: filter.selector.trim(),
        }
        : null;
    case "nth":
      return {
        kind: "nth",
        index: filter.index,
      };
  }
}

/** Clean one transform; a `regex`/`replace` with a blank pattern is dropped (`null`). */
function cleanTransform(transform: FillTransform): FillTransform | null {
  switch (transform.kind) {
    case "regex":
      return transform.pattern
        ? {
          kind: "regex",
          pattern: transform.pattern,
          ...(transform.flags
            ? {
              flags: transform.flags,
            }
            : {}),
          ...(transform.group !== undefined
            ? {
              group: transform.group,
            }
            : {}),
        }
        : null;
    case "replace":
      return transform.pattern
        ? {
          kind: "replace",
          pattern: transform.pattern,
          replacement: transform.replacement ?? "",
          ...(transform.flags
            ? {
              flags: transform.flags,
            }
            : {}),
        }
        : null;
    case "number":
      return {
        kind: "number",
      };
    case "duration":
      return {
        kind: "duration",
      };
    case "date":
      return {
        kind: "date",
      };
    case "trim":
      return {
        kind: "trim",
      };
    case "affix": {
      // Drop a no-op row that sets neither prefix nor suffix (mirrors blank-regex → null).
      if (!transform.prefix && !transform.suffix) return null;
      return {
        kind: "affix",
        ...(transform.prefix
          ? {
            prefix: transform.prefix,
          }
          : {}),
        ...(transform.suffix
          ? {
            suffix: transform.suffix,
          }
          : {}),
      };
    }
    case "absoluteUrl":
      return {
        kind: "absoluteUrl",
      };
    case "youtubeThumbnail":
      return {
        kind: "youtubeThumbnail",
      };
  }
}

/**
 * Keep an `attr` read only when it names an attribute, and a `backgroundImage` read as-is; omit `text`
 * (the default).
 */
function cleanRead(read: FillExtract["read"]): FillExtract["read"] | undefined {
  if (read?.kind === "attr" && read.name) {
    return {
      kind: "attr",
      name: read.name,
    };
  }
  if (read?.kind === "backgroundImage") return {
    kind: "backgroundImage",
  };
  return undefined;
}

/**
 * Clean one extract. A `meta` source needs a non-blank `metaKey`; the default `selector` source
 * needs a non-blank `selector`. Either missing makes the rule unusable (`null`).
 */
function cleanExtract(extract: FillExtract, isTaxonomy: boolean): FillExtract | null {
  const isMeta = extract.source === "meta";
  const selector = (extract.selector ?? "").trim();
  const metaKey = (extract.metaKey ?? "").trim();
  if (isMeta ? !metaKey : !selector) return null;
  const filters = (extract.filters ?? [])
    .map(cleanFilter)
    .filter((filter): filter is FillFilter => filter !== null);
  const transform = (extract.transform ?? [])
    .map(cleanTransform)
    .filter((entry): entry is FillTransform => entry !== null);
  const read = cleanRead(extract.read);
  const split = isTaxonomy && extract.split && extract.split.length > 0 ? extract.split : undefined;
  return {
    ...(isMeta
      ? {
        source: "meta" as const,
        metaKey,
      }
      : {
        selector,
      }),
    ...(filters.length
      ? {
        filters,
      }
      : {}),
    // A meta source reads `content` by default; only keep an explicit `attr` override.
    ...(read
      ? {
        read,
      }
      : {}),
    ...(transform.length
      ? {
        transform,
      }
      : {}),
    ...(split
      ? {
        split,
      }
      : {}),
  };
}

/**
 * Serialize editor drafts into a schema-clean rules array for the PATCH payload. Drops rules with an
 * incomplete target or blank selector, drops a blank `pathMatch` gate, and normalizes each nested
 * variant so no stray field survives an `additionalProperties: false` validation pass.
 */
export function normalizeExtensionFillRules(
  rules: WebsiteExtensionFillRule[],
): WebsiteExtensionFillRule[] {
  const result: WebsiteExtensionFillRule[] = [];
  for (const rule of rules) {
    const target = cleanTarget(rule.target);
    if (!target) continue;
    const extract = cleanExtract(rule.extract, target.kind === "taxonomy");
    if (!extract) continue;
    const pathMatch = rule.pathMatch ? cleanPathMatch(rule.pathMatch) : null;
    result.push({
      id: rule.id,
      label: rule.label.trim(),
      ...(pathMatch
        ? {
          pathMatch,
        }
        : {}),
      target,
      extract,
    });
  }
  return result;
}
