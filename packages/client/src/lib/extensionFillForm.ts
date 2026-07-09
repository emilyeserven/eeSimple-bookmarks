import type {
  CustomProperty,
  FillExtract,
  FillFilter,
  FillTarget,
  FillTransform,
  TextMatch,
  WebsiteExtensionFillRule,
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
  }
}

// ---------------------------------------------------------------------------
// Kind-change coercion (rebuild a variant keeping only its own fields)
// ---------------------------------------------------------------------------

/** Rebuild a target for a newly-selected `kind`, preserving a same-kind value where possible. */
export function coerceFillTarget(kind: FillTarget["kind"], prev: FillTarget): FillTarget {
  switch (kind) {
    case "field":
      return {
        kind: "field",
        field: prev.kind === "field" ? prev.field : "title",
      };
    case "customProperty":
      return {
        kind: "customProperty",
        propertyId: prev.kind === "customProperty" ? prev.propertyId : "",
        // Preserve the per-value discriminators across a same-kind rebuild (e.g. a property swap).
        ...(prev.kind === "customProperty" && prev.subField !== undefined
          ? {
            subField: prev.subField,
          }
          : {}),
        ...(prev.kind === "customProperty" && prev.choiceValue !== undefined
          ? {
            choiceValue: prev.choiceValue,
          }
          : {}),
      };
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
  }
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
    case "trim":
      return {
        kind: "trim",
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

/** Clean one target; a `customProperty` with no selected property is incomplete (`null`). */
function cleanTarget(target: FillTarget): FillTarget | null {
  switch (target.kind) {
    case "field":
      return {
        kind: "field",
        field: target.field,
      };
    case "customProperty":
      return target.propertyId
        ? {
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
        }
        : null;
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
    case "trim":
      return {
        kind: "trim",
      };
  }
}

/** Keep an `attr` read only when it names an attribute; omit `text` (the default). */
function cleanRead(read: FillExtract["read"]): FillExtract["read"] | undefined {
  if (read?.kind === "attr" && read.name) {
    return {
      kind: "attr",
      name: read.name,
    };
  }
  return undefined;
}

/** Clean one extract; a blank selector makes the whole rule unusable (`null`). */
function cleanExtract(extract: FillExtract, isTaxonomy: boolean): FillExtract | null {
  const selector = extract.selector.trim();
  if (!selector) return null;
  const filters = (extract.filters ?? [])
    .map(cleanFilter)
    .filter((filter): filter is FillFilter => filter !== null);
  const transform = (extract.transform ?? [])
    .map(cleanTransform)
    .filter((entry): entry is FillTransform => entry !== null);
  const read = cleanRead(extract.read);
  const split = isTaxonomy && extract.split && extract.split.length > 0 ? extract.split : undefined;
  return {
    selector,
    ...(filters.length
      ? {
        filters,
      }
      : {}),
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
 * incomplete target or blank selector, strips a blank `pathSuffix`, and normalizes each nested
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
    const pathSuffix = rule.pathSuffix?.trim();
    result.push({
      id: rule.id,
      label: rule.label.trim(),
      ...(pathSuffix
        ? {
          pathSuffix,
        }
        : {}),
      target,
      extract,
    });
  }
  return result;
}
