import type { FillRow } from "./rowTypes";
import type { ExtractedSectionEntry } from "../../lib/fill/fillSections";
import type {
  Bookmark,
  CustomProperty,
  ExtensionFillContext,
  FillTarget,
  WebsiteExtensionFillRule,
} from "@eesimple/types";

import { resolveTaxonomyId } from "../../lib/taxonomy/taxonomyFill";
import { session } from "../session";
import { formatScalar, toFiniteNumber } from "./format";
import { baseRow, diffRow } from "./rowTypes";
import {
  assignSectionIds,
  carrySectionCompletion,
  diffSections,
  sectionsContentEqual,
  summarizeSections,
} from "./sections";
import { seedValueMap } from "./valueMaps";

type TargetOf<K extends FillTarget["kind"]> = Extract<FillTarget, { kind: K }>;

/** A bookmark scalar field (title / description / isbn / year). */
export function buildFieldRow(rule: WebsiteExtensionFillRule, target: TargetOf<"field">, values: string[], bookmark: Bookmark): FillRow {
  const field = target.field;
  const extracted = values[0] ?? "";
  const current = bookmark[field];
  if (!extracted) return baseRow(rule, formatScalar(current), "", false, "not found");
  if (field === "year") {
    const num = toFiniteNumber(extracted);
    if (num === null) return baseRow(rule, formatScalar(current), extracted, false, "not found");
    const row = diffRow(rule, formatScalar(current), String(num), current !== num);
    row.apply = (patch) => {
      patch[field] = num;
    };
    return row;
  }
  const row = diffRow(rule, formatScalar(current), extracted, (current ?? "") !== extracted);
  row.apply = (patch) => {
    patch[field] = extracted;
  };
  return row;
}

/**
 * Resolve an extracted value to a usable image URL: an absolute http(s) URL against the current tab, or
 * an inline `data:image/svg+xml` URI (returned verbatim). Null for anything else.
 */
export function resolveImageUrl(value: string, baseUrl: string | undefined = session.currentTab?.url): string | null {
  const trimmed = value.trim();
  if (/^data:image\/svg\+xml[;,]/i.test(trimmed)) return trimmed;
  try {
    const resolved = new URL(trimmed, baseUrl);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return null;
    return resolved.href;
  }
  catch {
    return null;
  }
}

/** Image grab → bookmark image upload (its own phase after the PATCH — see `apply.ts`). */
export function buildImageRow(rule: WebsiteExtensionFillRule, target: TargetOf<"image">, values: string[], bookmark: Bookmark): FillRow {
  const urls = values.map(value => resolveImageUrl(value)).filter((url): url is string => url !== null);
  const currentText = bookmark.images.length > 0 ? "1 image" : "—";
  if (!urls.length) return baseRow(rule, currentText, "", false, "not found");
  const setMain = !!target.setMain;
  const row = baseRow(rule, currentText, setMain ? `${urls.length} image → main` : `${urls.length} image`, true, null);
  row.image = {
    urls,
    setMain,
  };
  return row;
}

/** A structured `sections` property value built from the page. */
export function buildSectionsRow(
  rule: WebsiteExtensionFillRule,
  target: TargetOf<"sections">,
  extractedEntries: ExtractedSectionEntry[],
  bookmark: Bookmark,
  properties: readonly CustomProperty[],
): FillRow {
  const property = properties.find(p => p.id === target.propertyId);
  if (property?.type !== "sections") return baseRow(rule, "", "", false, "unsupported");
  const existing = bookmark.sectionsValues.find(v => v.propertyId === property.id);
  // Re-fills must not wipe read progress: carry the stored entries' `completed` flags over.
  const entries = carrySectionCompletion(assignSectionIds(extractedEntries), existing?.sections);
  const currentText = existing ? summarizeSections(existing.sections) : "—";
  if (entries.length === 0) return baseRow(rule, currentText, "", false, "not found");
  // Changed only when the content differs (ids are regenerated on every scrape, so they're ignored).
  const changed = !existing || !sectionsContentEqual(entries, existing.sections);
  const row = diffRow(rule, currentText, summarizeSections(entries), changed);
  row.sectionsDiff = diffSections(existing?.sections ?? [], entries);
  row.apply = (_patch, state) => {
    seedValueMap(state, "sectionsValues", bookmark).set(property.id, {
      propertyId: property.id,
      // A rule can declare its list exhaustive; otherwise keep the stored flag (false on a first fill).
      exhaustive: target.exhaustive === true ? true : (existing?.exhaustive ?? false),
      sections: entries,
    });
  };
  return row;
}

/** Multi-value bookmark taxonomy (people / groups / locations / tags): match-or-create, then union. */
export function buildTaxonomyRow(
  rule: WebsiteExtensionFillRule,
  target: TargetOf<"taxonomy">,
  extractedNames: string[],
  bookmark: Bookmark,
  ctx: ExtensionFillContext,
): FillRow {
  const kind = target.taxonomy;
  const linked: { id: string;
    name: string; }[] | undefined = bookmark[kind];
  const assigned = (linked ?? []).map(x => x.name);
  const currentText = assigned.join(", ") || "—";
  if (!extractedNames.length) return baseRow(rule, currentText, "", false, "not found");
  const assignedLower = new Set(assigned.map(n => n.toLowerCase()));
  const toAdd = extractedNames.filter(n => !assignedLower.has(n.toLowerCase()));
  if (!toAdd.length) return baseRow(rule, currentText, extractedNames.join(", "), false, "no change");
  const optionList = ctx.taxonomies?.[kind] ?? [];
  const optionLower = new Set(optionList.map(o => o.name.toLowerCase()));

  const row = baseRow(rule, currentText, extractedNames.join(", "), true, null);
  row.extractedNames = extractedNames;
  row.newNames = toAdd.filter(n => !optionLower.has(n.toLowerCase()));
  row.apply = async (_patch, state) => {
    let ids = state.tax[kind];
    if (!ids) {
      // The PATCH is delete-then-relink, so seed from the current links. Record whether they were
      // actually hydrated — sending an id array built from absent links would wipe them (see the
      // guard in apply.ts).
      ids = new Set((linked ?? []).map(x => x.id));
      state.tax[kind] = ids;
      state.taxHydrated[kind] = Array.isArray(linked);
    }
    for (const name of toAdd) {
      const {
        id, created,
      } = await resolveTaxonomyId(session.serverUrl, kind, name, optionList);
      if (id) {
        ids.add(id);
        if (created) state.created.push({
          kind,
          name,
        });
      }
      else {
        state.failed.push({
          kind,
          name,
        });
      }
    }
  };
  return row;
}
