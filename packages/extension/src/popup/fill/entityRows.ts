import type { EntityDisplay } from "./entityDisplay";
import type {
  ApplyState,
  EntityBucket,
  EntityTarget,
  FillRow,
  LanguageEntityTarget,
  RelationEntityTarget,
  ScalarEntityTarget,
} from "./rowTypes";
import type {
  ExtensionFillContext,
  FillTarget,
  SocialLink,
  TaxonomyEntityAssociationSpec,
  TaxonomyEntityRelationKey,
  TaxonomyEntityTermRef,
  WebsiteExtensionFillRule,
} from "@eesimple/types";

import { ENTITY_NOUN, entitySpec, resolveRelationId } from "../../lib/taxonomy/taxonomyFill";
import { session } from "../session";
import {
  entityAllTermsDisplay,
  entityFieldDisplay,
  entityLanguageDisplay,
  entityRelationDisplay,
  entityTargetTerms,
  termRelationIds,
} from "./entityDisplay";
import { toFiniteNumber } from "./format";
import { ALL_TERMS, baseRow } from "./rowTypes";

type EntityFillTarget = Extract<FillTarget, { kind: "taxonomyEntity" }>;

/*
 * `taxonomyEntity`: write the extracted value into a taxonomy term the bookmark is *linked to*. Three
 * write modes — a scalar field, a relation (id-array union), or a primary-language write. A single
 * linked term is auto-targeted; several default to "all terms" and get a picker in the review.
 */
export function buildTaxonomyEntityRow(
  rule: WebsiteExtensionFillRule,
  target: EntityFillTarget,
  values: string[],
  ctx: ExtensionFillContext,
): FillRow {
  const spec = entitySpec(target.association);
  const terms = ctx.associatedTerms?.[target.association] ?? [];
  const field = target.field;
  if (field === "language") return buildLanguageRow(rule, target, spec, terms, values, ctx);
  if (field.startsWith("relation:")) {
    const key = field.slice("relation:".length) as TaxonomyEntityRelationKey;
    return buildRelationRow(rule, target, spec, terms, key, values, ctx);
  }
  return buildScalarRow(rule, target, spec, terms, values);
}

/** Turn a target + its display into the row (shared by the three modes). */
function entityRow(rule: WebsiteExtensionFillRule, entity: EntityTarget, single: EntityDisplay | null, multi: boolean): FillRow {
  const display = multi ? entityAllTermsDisplay(entity) : single as EntityDisplay;
  // A multi-term row stays interactive even when every term is in sync — the user may narrow to one.
  let disabledReason: string | null = null;
  if (!multi) disabledReason = display.disabledReason !== undefined ? display.disabledReason : (display.changed ? null : "no change");
  const row = baseRow(rule, display.currentText, display.extractedText ?? "", display.changed, disabledReason);
  row.entity = entity;
  return row;
}

function noLinkedTerm(rule: WebsiteExtensionFillRule, target: EntityFillTarget, extractedText: string): FillRow {
  return baseRow(rule, "—", extractedText, false, `no linked ${ENTITY_NOUN[target.association]}`);
}

function buildScalarRow(
  rule: WebsiteExtensionFillRule,
  target: EntityFillTarget,
  spec: TaxonomyEntityAssociationSpec,
  terms: TaxonomyEntityTermRef[],
  values: string[],
): FillRow {
  const field = target.field as ScalarEntityTarget["field"];
  const extracted = values[0] ?? "";
  if (field === "socialLink" && !target.socialPlatform) return baseRow(rule, "", extracted, false, "unsupported");
  if (!extracted) return baseRow(rule, "", "", false, "not found");
  if (terms.length === 0) return noLinkedTerm(rule, target, extracted);
  let coerced: string | number = extracted;
  if (field === "year") {
    const num = toFiniteNumber(extracted);
    if (num === null) return baseRow(rule, "", extracted, false, "not found");
    coerced = num;
  }
  const multi = terms.length > 1;
  const entity: ScalarEntityTarget = {
    mode: "scalar",
    association: target.association,
    spec,
    terms,
    field,
    socialPlatform: target.socialPlatform,
    extracted,
    coerced,
    selectedTermId: multi ? ALL_TERMS : terms[0].id,
  };
  const row = entityRow(rule, entity, multi ? null : entityFieldDisplay(entity, terms[0]), multi);
  row.apply = (_patch, state) => {
    for (const term of entityTargetTerms(entity)) writeScalarEntity(state, entity, term);
  };
  return row;
}

function buildRelationRow(
  rule: WebsiteExtensionFillRule,
  target: EntityFillTarget,
  spec: TaxonomyEntityAssociationSpec,
  terms: TaxonomyEntityTermRef[],
  key: TaxonomyEntityRelationKey,
  extractedNames: string[],
  ctx: ExtensionFillContext,
): FillRow {
  const relSpec = spec.relations?.find(r => r.key === key);
  if (!relSpec) return baseRow(rule, "", extractedNames[0] ?? "", false, "unsupported");
  if (terms.length === 0) return noLinkedTerm(rule, target, extractedNames.join(", "));
  if (!extractedNames.length) return baseRow(rule, "—", "", false, "not found");
  const multi = terms.length > 1;
  const entity: RelationEntityTarget = {
    mode: "relation",
    association: target.association,
    spec,
    terms,
    relSpec,
    optionList: ctx.relationOptions?.[relSpec.optionKey] ?? [],
    extractedNames,
    selectedTermId: multi ? ALL_TERMS : terms[0].id,
  };
  const firstTerm = entityRelationDisplay(entity, terms[0]);
  const row = entityRow(rule, entity, firstTerm, multi);
  // Badges are advisory and computed from the first term — they don't refresh on a term switch.
  row.extractedNames = extractedNames;
  row.newNames = firstTerm.newNames;
  row.unmatchedNames = firstTerm.unmatchedNames;
  row.apply = async (_patch, state) => {
    await accumulateRelationPatch(state, entity);
  };
  return row;
}

function buildLanguageRow(
  rule: WebsiteExtensionFillRule,
  target: EntityFillTarget,
  spec: TaxonomyEntityAssociationSpec,
  terms: TaxonomyEntityTermRef[],
  values: string[],
  ctx: ExtensionFillContext,
): FillRow {
  const ownerType = spec.languageOwnerType;
  const extracted = values[0] ?? "";
  if (!ownerType) return baseRow(rule, "", extracted, false, "unsupported");
  const primaryLevelId = ctx.primaryLanguageLevelId;
  if (primaryLevelId == null) return baseRow(rule, "—", extracted, false, "no Primary Language level");
  if (!extracted) return baseRow(rule, "", "", false, "not found");
  if (terms.length === 0) return noLinkedTerm(rule, target, extracted);
  const multi = terms.length > 1;
  const entity: LanguageEntityTarget = {
    mode: "language",
    association: target.association,
    spec,
    terms,
    ownerType,
    extracted,
    languages: ctx.languages ?? [],
    primaryLevelId,
    selectedTermId: multi ? ALL_TERMS : terms[0].id,
  };
  const row = entityRow(rule, entity, multi ? null : entityLanguageDisplay(entity, terms[0]), multi);
  row.apply = (_patch, state) => {
    state.languageWrites.push(row);
  };
  return row;
}

/** The term's PATCH bucket, created on first use. Keyed `association:termId` so rules collapse. */
function bucketFor(state: ApplyState, entity: EntityTarget, termId: string): EntityBucket {
  const key = `${entity.association}:${termId}`;
  let bucket = state.entityPatches[key];
  if (!bucket) {
    bucket = {
      path: entity.spec.apiPath,
      id: termId,
      patch: {},
      socialSeeded: false,
      relationSeeded: {},
    };
    state.entityPatches[key] = bucket;
  }
  return bucket;
}

/** Upsert one platform's link into a copy of the term's current links, so its other platforms survive. */
export function upsertSocialLink(bucket: EntityBucket, current: readonly SocialLink[] | undefined, platform: SocialLink["platform"], url: string): void {
  if (!bucket.socialSeeded) {
    bucket.patch.socialLinks = (current ?? []).map(l => ({
      platform: l.platform,
      url: l.url,
    }));
    bucket.socialSeeded = true;
  }
  const links = bucket.patch.socialLinks as SocialLink[];
  const next = {
    platform,
    url,
  } as SocialLink;
  const idx = links.findIndex(l => l.platform === platform);
  if (idx >= 0) links[idx] = next;
  else links.push(next);
}

/** Merge a scalar write into the term's PATCH bucket. */
export function writeScalarEntity(state: ApplyState, e: ScalarEntityTarget, term: TaxonomyEntityTermRef): void {
  const bucket = bucketFor(state, e, term.id);
  switch (e.field) {
    case "socialLink":
      if (e.socialPlatform) upsertSocialLink(bucket, term.socialLinks, e.socialPlatform, e.extracted);
      break;
    case "name":
      bucket.patch[e.spec.nameKey] = e.extracted;
      break;
    case "year":
      bucket.patch.year = e.coerced;
      break;
    case "description":
      bucket.patch.description = e.extracted;
      break;
  }
}

/**
 * Resolve the extracted names ONCE (term-independent, so created/failed are recorded once), then union
 * the ids into each targeted term's bucket — seeded from the term's current ids. A term whose ids
 * weren't hydrated is skipped rather than risk wiping links we can't see.
 */
async function accumulateRelationPatch(state: ApplyState, e: RelationEntityTarget): Promise<void> {
  const {
    relSpec,
  } = e;
  const resolvedIds: string[] = [];
  for (const name of e.extractedNames) {
    const {
      id, created,
    } = await resolveRelationId(session.serverUrl, relSpec, name, e.optionList);
    if (id) {
      resolvedIds.push(id);
      if (created) state.created.push({
        kind: relSpec.optionKey,
        name,
      });
    }
    else {
      state.failed.push({
        kind: relSpec.optionKey,
        name,
      });
    }
  }
  for (const term of entityTargetTerms(e)) {
    const currentIds = termRelationIds(e, term);
    if (currentIds === null) continue;
    const bucket = bucketFor(state, e, term.id);
    if (!bucket.relationSeeded[relSpec.patchKey]) {
      bucket.patch[relSpec.patchKey] = currentIds.slice();
      bucket.relationSeeded[relSpec.patchKey] = true;
    }
    const idSet = new Set(bucket.patch[relSpec.patchKey] as string[]);
    for (const id of resolvedIds) idSet.add(id);
    bucket.patch[relSpec.patchKey] = Array.from(idSet);
  }
}
