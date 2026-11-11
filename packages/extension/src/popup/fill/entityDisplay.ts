import type {
  EntityTarget,
  LanguageEntityTarget,
  RelationEntityTarget,
  ScalarEntityTarget,
} from "./rowTypes";
import type { TaxonomyEntityTermRef } from "@eesimple/types";

import { formatScalar } from "./format";
import { ALL_TERMS } from "./rowTypes";
import { normalizeLanguageCode } from "../../lib/taxonomy/taxonomyFill";

/*
 * Current → extracted display for `taxonomyEntity` rows, per linked term. Recomputed by the review
 * term picker when the user narrows a multi-term row to one term.
 */

export interface EntityDisplay {
  currentText: string;
  /** Absent for relation rows, which render their extracted names instead. */
  extractedText?: string;
  changed: boolean;
  disabledReason?: string | null;
}

/** The terms an entity row applies to: every linked term in "all" mode, else the picked term. */
export function entityTargetTerms(e: EntityTarget): TaxonomyEntityTermRef[] {
  if (e.selectedTermId === ALL_TERMS) return e.terms;
  const picked = e.terms.find(t => t.id === e.selectedTermId) ?? e.terms[0];
  return picked ? [picked] : [];
}

/** The current stored value of a scalar entity row's target field on `term` (undefined = unset). */
function entityFieldValue(e: ScalarEntityTarget, term: TaxonomyEntityTermRef): string | number | undefined {
  switch (e.field) {
    case "socialLink":
      return term.socialLinks?.find(l => l.platform === e.socialPlatform)?.url;
    case "year":
      return term.year ?? undefined;
    case "name":
      return term.name;
    case "description":
      return term.description ?? undefined;
  }
}

export function entityFieldDisplay(e: ScalarEntityTarget, term: TaxonomyEntityTermRef): EntityDisplay {
  const current = entityFieldValue(e, term);
  if (e.field === "year") {
    return {
      currentText: formatScalar(current),
      extractedText: String(e.coerced),
      changed: current !== e.coerced,
    };
  }
  return {
    currentText: formatScalar(current),
    extractedText: e.extracted,
    changed: (current ?? "") !== e.extracted,
  };
}

/** A relation id-array on a term, or null when it wasn't hydrated (the wipe guard). */
export function termRelationIds(e: RelationEntityTarget, term: TaxonomyEntityTermRef): string[] | null {
  const ids = term[e.relSpec.patchKey];
  return Array.isArray(ids) ? ids : null;
}

export interface RelationDisplay extends EntityDisplay {
  toAdd: string[];
  newNames: string[];
  unmatchedNames: string[];
}

/**
 * Which extracted names are already linked to `term`, which will be created (creatable relation), and
 * which have no match (match-only relation).
 */
export function entityRelationDisplay(e: RelationEntityTarget, term: TaxonomyEntityTermRef): RelationDisplay {
  const currentIds = termRelationIds(e, term) ?? [];
  const byLower = new Map(e.optionList.map(o => [o.name.toLowerCase(), o]));
  const byId = new Map(e.optionList.map(o => [o.id, o]));
  const currentIdSet = new Set(currentIds);
  const currentNames = currentIds.flatMap((id) => {
    const name = byId.get(id)?.name;
    return name === undefined ? [] : [name];
  });
  const toAdd: string[] = [];
  const newNames: string[] = [];
  const unmatchedNames: string[] = [];
  for (const name of e.extractedNames) {
    const opt = byLower.get(name.toLowerCase());
    if (opt && currentIdSet.has(opt.id)) continue;
    toAdd.push(name);
    if (!opt) (e.relSpec.matchOnly ? unmatchedNames : newNames).push(name);
  }
  return {
    currentText: currentNames.join(", ") || "—",
    changed: toAdd.length > 0,
    toAdd,
    newNames,
    unmatchedNames,
  };
}

/** The term's existing primary language vs the incoming one. Never clobbers an existing pick. */
export function entityLanguageDisplay(e: LanguageEntityTarget, term: TaxonomyEntityTermRef): EntityDisplay {
  const existingPrimary = term.languageUsages?.find(u => u.usageLevelId === e.primaryLevelId);
  const currentName = existingPrimary ? e.languages.find(l => l.id === existingPrimary.languageId)?.name : undefined;
  const currentText = existingPrimary ? formatScalar(currentName) : "—";
  const normalized = normalizeLanguageCode(e.extracted);
  const match = normalized ? e.languages.find(l => l.isoCode === normalized) : undefined;
  const extractedText = match ? match.name : (normalized ?? e.extracted);
  let disabledReason: string | null = null;
  if (existingPrimary) disabledReason = "already set";
  else if (!normalized) disabledReason = "not found";
  return {
    currentText,
    extractedText,
    changed: disabledReason === null,
    disabledReason,
  };
}

/** Mode-aware display for an entity row against one term. */
export function entityDisplayForTerm(e: EntityTarget, term: TaxonomyEntityTermRef): EntityDisplay {
  switch (e.mode) {
    case "relation":
      return entityRelationDisplay(e, term);
    case "language":
      return entityLanguageDisplay(e, term);
    case "scalar":
      return entityFieldDisplay(e, term);
  }
}

/**
 * Aggregate display when the row targets ALL linked terms: `changed` when any term would change;
 * the extracted text is term-independent, so borrow the first term's.
 */
export function entityAllTermsDisplay(e: EntityTarget): EntityDisplay {
  const changed = e.terms.some(t => entityDisplayForTerm(e, t).changed);
  const first = e.terms[0];
  return {
    currentText: `${e.terms.length} terms`,
    extractedText: first ? entityDisplayForTerm(e, first).extractedText : undefined,
    changed,
  };
}
