import type {
  CustomProperty,
  FillExtract,
  FillFilter,
  FillTarget,
  FillTransform,
  PathMatch,
  TaxonomyEntityAssociation,
  TaxonomyEntityAssociationSpec,
  TaxonomyEntityFieldKey,
  TaxonomyEntityRelationKey,
  TaxonomyEntityWriteKey,
  TextMatch,
} from "@eesimple/types";

import {
  SOCIAL_MEDIA_PLATFORM_LABELS,
  TAXONOMY_ENTITY_FIELD_LABELS,
  TAXONOMY_ENTITY_RELATION_LABELS,
  TAXONOMY_ENTITY_SPECS,
} from "@eesimple/types";

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
      if (target.ratingBound === "range") return `${name} · Range (detected)`;
      if (target.ratingBound) return `${name} · ${target.ratingBound === "from" ? "From" : "To"}`;
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
      const isGrouped = Boolean(
        target.sectionMatch?.value.trim() || target.sectionHeaderSelector?.trim() || target.container?.trim(),
      );
      const grouped = isGrouped ? " · grouped" : "";
      const exhaustive = target.exhaustive ? " · exhaustive" : "";
      return `${name} · ${SECTION_FILL_ENTRY_TYPE_LABELS[target.entryType]}${grouped}${exhaustive}`;
    }
  }
}

/** Human labels for the `sections` target's entry types. */
export const SECTION_FILL_ENTRY_TYPE_LABELS: Record<
  Extract<FillTarget, { kind: "sections" }>["entryType"],
  string
> = {
  name: "Name only",
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

/** A short summary of how the value is read: an attribute, a CSS background image, inline SVG, or trimmed text. */
export function describeFillRead(read: FillExtract["read"]): string {
  if (read?.kind === "attr" && read.name) return `Attribute: ${read.name}`;
  if (read?.kind === "backgroundImage") return "Background image URL";
  if (read?.kind === "svg") return "Inline SVG";
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
    case "exclude":
      return `Exclude ${describeTextMatch(filter.match)}`;
    case "excludeSelector":
      return `Exclude nodes matching "${filter.selector}"`;
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
    case "capitalizeFirst":
      return "Capitalize first letter";
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
