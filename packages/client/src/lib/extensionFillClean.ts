import type {
  EntityResolution,
  FillExtract,
  FillFilter,
  FillTarget,
  FillTransform,
  PathMatch,
  SectionNamePart,
  TextMatch,
  WebsiteExtensionFillRule,
} from "@eesimple/types";

import { directFieldSupported } from "./extensionFillCoerce";

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
    ...(target.ratingBound !== undefined
      ? {
        ratingBound: target.ratingBound,
      }
      : {}),
    // The shared selector, global match mode, and per-level detectors ride only in "range" mode.
    ...(target.ratingBound === "range" ? cleanRatingRangeFields(target) : {}),
  };
}

/** Range-mode rating fields (shared selector, global exact toggle, per-level detectors), cleaned. */
function cleanRatingRangeFields(
  target: Extract<FillTarget, { kind: "customProperty" }>,
): Partial<Extract<FillTarget, { kind: "customProperty" }>> {
  const sharedSelector = (target.ratingSelector ?? "").trim();
  // Keep a level only if it can be detected — an own selector or match text. A bare level (no
  // selector, no text) would match wherever the shared selector matches, i.e. for every level.
  const ratingLevels = (target.ratingLevels ?? [])
    .map(detector => ({
      level: detector.level,
      selector: (detector.selector ?? "").trim(),
      matchText: (detector.matchText ?? "").trim(),
    }))
    .filter(detector => detector.selector !== "" || detector.matchText !== "")
    .map(detector => ({
      level: detector.level,
      ...(detector.selector !== ""
        ? {
          selector: detector.selector,
        }
        : {}),
      ...(detector.matchText !== ""
        ? {
          matchText: detector.matchText,
        }
        : {}),
    }));
  return {
    ...(sharedSelector !== ""
      ? {
        ratingSelector: sharedSelector,
      }
      : {}),
    ...(typeof target.ratingMatchExact === "boolean"
      ? {
        ratingMatchExact: target.ratingMatchExact,
      }
      : {}),
    ...(typeof target.ratingMatchCaseSensitive === "boolean"
      ? {
        ratingMatchCaseSensitive: target.ratingMatchCaseSensitive,
      }
      : {}),
    ...(ratingLevels.length > 0
      ? {
        ratingLevels,
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
 * non-blank, and enforce a single grouping mode by the engine's precedence
 * (`sectionMatch` > `sectionHeaderSelector` > `container`): the higher-priority mode's presence drops
 * the lower ones' fields, so the saved target is never the self-contradictory multi-mode the editor's
 * mode switch already prevents.
 */
/**
 * Normalize the composed-name parts: trim each part's selector, drop empty transform/filter arrays,
 * and drop any part that carries no selector / read / filter / transform at all.
 */
function cleanSectionNameParts(parts: SectionNamePart[] | undefined): SectionNamePart[] {
  if (!parts) return [];
  return parts
    .map((part) => {
      const selector = part.selector?.trim();
      const filters = part.filters ?? [];
      const transform = part.transform ?? [];
      const cleaned: SectionNamePart = {};
      if (selector) cleaned.selector = selector;
      if (part.read) cleaned.read = part.read;
      if (filters.length > 0) cleaned.filters = filters;
      if (transform.length > 0) cleaned.transform = transform;
      return cleaned;
    })
    .filter(part => part.selector || part.read || part.filters || part.transform);
}

function cleanSectionsTarget(
  target: Extract<FillTarget, { kind: "sections" }>,
): FillTarget | null {
  if (!target.propertyId) return null;
  const itemName = target.itemName?.trim();
  const itemUrl = target.itemUrl?.trim();
  const nameParts = cleanSectionNameParts(target.nameParts);
  // The separator is deliberately NOT trimmed — e.g. ": " carries a meaningful trailing space.
  const namePartSeparator = nameParts.length > 0 && target.namePartSeparator
    ? target.namePartSeparator
    : undefined;
  const sectionMatch = target.sectionMatch?.value.trim()
    ? target.sectionMatch
    : undefined;
  // Grouping modes are mutually exclusive, in precedence order (text match > header selector > container).
  const sectionHeaderSelector = sectionMatch ? undefined : target.sectionHeaderSelector?.trim();
  const groupedAbove = sectionMatch || sectionHeaderSelector;
  const container = groupedAbove ? undefined : target.container?.trim();
  const header = groupedAbove ? undefined : target.header?.trim();
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
    // Only meaningful alongside an itemUrl; drop a stray flag when no per-item link is read.
    ...(itemUrl && target.resolveItemUrl
      ? {
        resolveItemUrl: true,
      }
      : {}),
    ...(nameParts.length > 0
      ? {
        nameParts,
      }
      : {}),
    ...(namePartSeparator !== undefined
      ? {
        namePartSeparator,
      }
      : {}),
    ...(sectionHeaderSelector
      ? {
        sectionHeaderSelector,
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
    case "exclude":
      return {
        kind: "exclude",
        match: cleanTextMatch(filter.match),
      };
    case "excludeSelector":
      return filter.selector.trim()
        ? {
          kind: "excludeSelector",
          selector: filter.selector.trim(),
        }
        : null;
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
    case "capitalizeFirst":
      return {
        kind: "capitalizeFirst",
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
  // Trim each exclude selector and drop blanks; a `meta` source reads `content`, so node stripping
  // (text-read only) is meaningless there and is omitted.
  const excludeSelectors = isMeta
    ? []
    : (extract.excludeSelectors ?? []).map(selector => selector.trim()).filter(Boolean);
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
    ...(excludeSelectors.length
      ? {
        excludeSelectors,
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
      // Preserve group membership so the rule reopens in its group after the round-trip.
      ...(rule.groupId
        ? {
          groupId: rule.groupId,
        }
        : {}),
    });
  }
  return result;
}
