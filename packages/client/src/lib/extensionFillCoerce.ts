import type {
  FillFilter,
  FillTarget,
  FillTransform,
  TaxonomyDirectFieldKey,
  TaxonomyEntityAssociation,
  TaxonomyEntityAssociationSpec,
} from "@eesimple/types";

import { TAXONOMY_ENTITY_SPECS } from "@eesimple/types";

import { newTextMatch } from "./extensionFillDrafts";

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
    ...(same?.ratingBound !== undefined
      ? {
        ratingBound: same.ratingBound,
      }
      : {}),
    ...(same?.ratingSelector !== undefined
      ? {
        ratingSelector: same.ratingSelector,
      }
      : {}),
    ...(same?.ratingMatchExact !== undefined
      ? {
        ratingMatchExact: same.ratingMatchExact,
      }
      : {}),
    ...(same?.ratingMatchCaseSensitive !== undefined
      ? {
        ratingMatchCaseSensitive: same.ratingMatchCaseSensitive,
      }
      : {}),
    ...(same?.ratingLevels !== undefined
      ? {
        ratingLevels: same.ratingLevels,
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
      entryType: "name",
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
    case "exclude":
      return {
        kind: "exclude",
        match,
      };
    case "excludeSelector":
      return {
        kind: "excludeSelector",
        selector: prev.kind === "excludeSelector" || prev.kind === "closest" ? prev.selector : "",
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
    case "capitalizeFirst":
      return {
        kind: "capitalizeFirst",
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
