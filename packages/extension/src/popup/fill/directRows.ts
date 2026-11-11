import type { FillRow, ScalarEntityTarget } from "./rowTypes";
import type { FillRunResult } from "../../lib/fill/fillEngine";
import type {
  ExtensionFillContext,
  FillTarget,
  TaxonomyEntityAssociationSpec,
  TaxonomyEntityTermRef,
  WebsiteExtensionFillRule,
} from "@eesimple/types";

import { resolveImageUrl } from "./bookmarkRows";
import { entityFieldDisplay } from "./entityDisplay";
import { writeScalarEntity } from "./entityRows";
import { toFiniteNumber } from "./format";
import { baseRow, diffRow } from "./rowTypes";
import { ENTITY_NOUN, entitySpec } from "../../lib/taxonomy/taxonomyFill";

type DirectTarget = Extract<FillTarget, { kind: "taxonomyDirect" }>;
type DirectScalarField = Exclude<DirectTarget["field"], "image">;

/*
 * `taxonomyDirect`: update a taxonomy entity identified from the current page (not via a linked
 * bookmark). `url` mode — the server pre-resolved the entity into `associatedTerms`; `match` mode — the
 * engine scraped an identifier (`resolveValue`), resolved to an id at apply time (see `directApply.ts`).
 */
export function buildTaxonomyDirectRow(
  rule: WebsiteExtensionFillRule,
  target: DirectTarget,
  result: FillRunResult | undefined,
  ctx: ExtensionFillContext,
): FillRow {
  const {
    association, field,
  } = target;
  const spec = entitySpec(association);
  const values = result?.values ?? [];
  const valueText = field === "image" ? "" : (values[0] ?? "");
  if ((field === "socialLink" && !target.socialPlatform) || (field === "image" && !spec.image)) {
    return baseRow(rule, "", values[0] ?? "", false, "unsupported");
  }
  if (target.resolve.mode === "url") {
    // The server resolves a url-mode entity to exactly one term.
    const term = ctx.associatedTerms?.[association]?.[0];
    if (!term) return baseRow(rule, "—", valueText, false, `no matching ${ENTITY_NOUN[association]}`);
    if (field === "image") return buildUrlImageRow(rule, values, spec, term);
    return buildUrlFieldRow(rule, target, field, values, spec, term);
  }
  const name = result?.resolveValue?.trim() ?? "";
  if (!name) return baseRow(rule, "—", valueText, false, "no entity name");
  if (field === "image") return buildMatchImageRow(rule, target, values, spec, name);
  return buildMatchFieldRow(rule, target, field, values, spec, name);
}

function imageUrls(values: string[]): string[] {
  return values.map(value => resolveImageUrl(value)).filter((url): url is string => url !== null);
}

/** A field value coerced for its field (`year` → a finite number), or null when it doesn't parse. */
function coerceDirectValue(field: DirectScalarField, extracted: string): string | number | null {
  return field === "year" ? toFiniteNumber(extracted) : extracted;
}

/** url mode, JSON field: reuse the linked-term scalar write path (single term, no picker). */
function buildUrlFieldRow(
  rule: WebsiteExtensionFillRule,
  target: DirectTarget,
  field: DirectScalarField,
  values: string[],
  spec: TaxonomyEntityAssociationSpec,
  term: TaxonomyEntityTermRef,
): FillRow {
  const extracted = values[0] ?? "";
  if (!extracted) return baseRow(rule, "", "", false, "not found");
  const coerced = coerceDirectValue(field, extracted);
  if (coerced === null) return baseRow(rule, "", extracted, false, "not found");
  const entity: ScalarEntityTarget = {
    mode: "scalar",
    association: target.association,
    spec,
    terms: [term],
    field,
    socialPlatform: target.socialPlatform,
    extracted,
    coerced,
    selectedTermId: term.id,
  };
  const display = entityFieldDisplay(entity, term);
  const row = diffRow(rule, display.currentText, display.extractedText ?? "", display.changed);
  row.entity = entity;
  row.apply = (_patch, state) => {
    writeScalarEntity(state, entity, term);
  };
  return row;
}

/** url mode, image: upload the grabbed image to the entity's image endpoint on apply. */
function buildUrlImageRow(rule: WebsiteExtensionFillRule, values: string[], spec: TaxonomyEntityAssociationSpec, term: TaxonomyEntityTermRef): FillRow {
  const urls = imageUrls(values);
  const currentText = term.imageUrl ? "1 image" : "—";
  if (!urls.length) return baseRow(rule, currentText, "", false, "not found");
  const row = baseRow(rule, currentText, `${urls.length} image`, true, null);
  row.directEntity = {
    resolveMode: "url",
    spec,
    termId: term.id,
    field: "image",
    imageUrls: urls,
  };
  return row;
}

function buildMatchImageRow(rule: WebsiteExtensionFillRule, target: DirectTarget, values: string[], spec: TaxonomyEntityAssociationSpec, name: string): FillRow {
  const urls = imageUrls(values);
  if (!urls.length) return baseRow(rule, "—", "", false, "not found");
  const row = baseRow(rule, "—", `${urls.length} image → ${name}`, true, null);
  row.directEntity = {
    resolveMode: "match",
    spec,
    association: target.association,
    resolveName: name,
    field: "image",
    imageUrls: urls,
  };
  return row;
}

function buildMatchFieldRow(
  rule: WebsiteExtensionFillRule,
  target: DirectTarget,
  field: DirectScalarField,
  values: string[],
  spec: TaxonomyEntityAssociationSpec,
  name: string,
): FillRow {
  const extracted = values[0] ?? "";
  if (!extracted) return baseRow(rule, "—", "", false, "not found");
  const coerced = coerceDirectValue(field, extracted);
  if (coerced === null) return baseRow(rule, "—", extracted, false, "not found");
  const row = baseRow(rule, `match: ${name}`, String(coerced), true, null);
  row.directEntity = {
    resolveMode: "match",
    spec,
    association: target.association,
    resolveName: name,
    field,
    socialPlatform: target.socialPlatform,
    value: extracted,
    coerced,
  };
  return row;
}
