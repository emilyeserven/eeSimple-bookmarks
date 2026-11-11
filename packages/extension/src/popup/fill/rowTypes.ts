import type { SectionDiffItem } from "./sections";
import type { BookmarkTaxonomyKind, LanguageOption, SummaryEntry } from "../../lib/taxonomy/taxonomyFill";
import type {
  Bookmark,
  ExtensionFillTaxonomyOption,
  SocialMediaPlatform,
  TaxonomyDirectFieldKey,
  TaxonomyEntityAssociation,
  TaxonomyEntityAssociationSpec,
  TaxonomyEntityFieldKey,
  TaxonomyEntityLanguageOwnerType,
  TaxonomyEntityRelationSpec,
  TaxonomyEntityTermRef,
  WebsiteExtensionFillRule,
} from "@eesimple/types";

/*
 * The review-row model. Each configured rule becomes one `FillRow`: the current → extracted display,
 * whether it's checked by default, why it's disabled (if it is), and how it applies. Plain bookmark-field
 * rows contribute to the single bookmark PATCH via `apply`; the marker props (`image` / `entity` /
 * `directEntity`) route a row to its own apply phase instead (see `apply.ts`).
 */

/** The custom-property value arrays a fill can write, keyed by their bookmark field / PATCH key. */
export type ValuePatchKey
  = | "numberValues"
    | "booleanValues"
    | "textValues"
    | "dateTimeValues"
    | "progressValues"
    | "choicesValues"
    | "sectionsValues";

/** One stored value of a value array (e.g. a `BookmarkNumberValue` for `numberValues`). */
export type ValueEntry<K extends ValuePatchKey> = Bookmark[K][number];

/** The bookmark PATCH body under construction (scalar fields + id arrays + value arrays). */
export type BookmarkPatch = Record<string, unknown>;

/** A taxonomy term's pending PATCH, merged across every row that targets it. */
export interface EntityBucket {
  path: string;
  id: string;
  patch: Record<string, unknown>;
  socialSeeded: boolean;
  relationSeeded: Partial<Record<TaxonomyEntityRelationSpec["patchKey"], boolean>>;
}

/** Accumulators shared across rows during one Apply. */
export interface ApplyState {
  /** Taxonomy id sets, unioned with the bookmark's existing links. */
  tax: Partial<Record<BookmarkTaxonomyKind, Set<string>>>;
  /** Whether each kind's current links were hydrated (the wipe guard). */
  taxHydrated: Partial<Record<BookmarkTaxonomyKind, boolean>>;
  /** Custom-property value maps, seeded from existing values so siblings aren't wiped. */
  values: { [K in ValuePatchKey]?: Map<string, ValueEntry<K>> };
  /** Per-term PATCH buckets for linked-taxonomy updates, keyed `association:termId`. */
  entityPatches: Record<string, EntityBucket>;
  /** Language rows queued for the language-usages phase. */
  languageWrites: FillRow[];
  created: SummaryEntry[];
  failed: SummaryEntry[];
}

/** Sentinel `selectedTermId` meaning "apply to every linked term" (term ids are UUIDs, never "*"). */
export const ALL_TERMS = "*";

interface EntityTargetBase {
  association: TaxonomyEntityAssociation;
  spec: TaxonomyEntityAssociationSpec;
  terms: TaxonomyEntityTermRef[];
  /** A term id, or {@link ALL_TERMS}. */
  selectedTermId: string;
}

/** A scalar write (name/description/year/socialLink) to linked term(s). */
export interface ScalarEntityTarget extends EntityTargetBase {
  mode: "scalar";
  field: TaxonomyEntityFieldKey;
  socialPlatform?: SocialMediaPlatform;
  extracted: string;
  coerced: string | number;
}

/** A relation write: union resolved ids into linked term(s)' id-array. */
export interface RelationEntityTarget extends EntityTargetBase {
  mode: "relation";
  relSpec: TaxonomyEntityRelationSpec;
  optionList: ExtensionFillTaxonomyOption[];
  extractedNames: string[];
}

/** A primary-language write to linked term(s). */
export interface LanguageEntityTarget extends EntityTargetBase {
  mode: "language";
  ownerType: TaxonomyEntityLanguageOwnerType;
  extracted: string;
  languages: LanguageOption[];
  primaryLevelId: string;
}

export type EntityTarget = ScalarEntityTarget | RelationEntityTarget | LanguageEntityTarget;

/** A `taxonomyDirect` row resolved from the page (applied in its own phase). */
export type DirectEntity
  = | {
    resolveMode: "url";
    spec: TaxonomyEntityAssociationSpec;
    termId: string;
    field: "image";
    imageUrls: string[];
  }
  | {
    resolveMode: "match";
    spec: TaxonomyEntityAssociationSpec;
    association: TaxonomyEntityAssociation;
    resolveName: string;
    field: "image";
    imageUrls: string[];
  }
  | {
    resolveMode: "match";
    spec: TaxonomyEntityAssociationSpec;
    association: TaxonomyEntityAssociation;
    resolveName: string;
    field: Exclude<TaxonomyDirectFieldKey, "image">;
    socialPlatform?: SocialMediaPlatform;
    value: string;
    coerced: string | number;
  };

export interface FillRow {
  rule: WebsiteExtensionFillRule;
  label: string;
  currentText: string;
  extractedText: string;
  /** Multi-value rows render names (with new / no-match badges) instead of `extractedText`. */
  extractedNames: string[] | null;
  newNames: string[];
  unmatchedNames?: string[];
  changed: boolean;
  disabledReason: string | null;
  apply: (patch: BookmarkPatch, state: ApplyState) => void | Promise<void>;
  checkbox: HTMLInputElement | null;
  sectionsDiff?: SectionDiffItem[];
  /** Image uploads to the bookmark (applied after the PATCH). */
  image?: {
    urls: string[];
    setMain: boolean;
  };
  entity?: EntityTarget;
  directEntity?: DirectEntity;
}

/** A row with no apply effect yet; builders override `apply` / set marker props. */
export function baseRow(
  rule: WebsiteExtensionFillRule,
  currentText: string,
  extractedText: string,
  changed: boolean,
  disabledReason: string | null,
): FillRow {
  return {
    rule,
    label: rule.label || "(unnamed)",
    currentText,
    extractedText,
    extractedNames: null,
    newNames: [],
    changed,
    disabledReason,
    apply: () => {
      // No-op default; disabled rows contribute nothing to the patch.
    },
    checkbox: null,
  };
}

/** A changed/no-change row: interactive when `changed`, otherwise disabled as "no change". */
export function diffRow(rule: WebsiteExtensionFillRule, currentText: string, extractedText: string, changed: boolean): FillRow {
  return baseRow(rule, currentText, extractedText, changed, changed ? null : "no change");
}
