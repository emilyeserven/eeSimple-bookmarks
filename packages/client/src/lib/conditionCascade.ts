/**
 * Helpers for the per-item cascade toggle on hierarchical condition leaves (Tags, Locations, Media
 * Types, Genres & Moods). A leaf stores `cascade*Ids` — the subset of selected ids that match their
 * whole subtree (checkbox checked). The value is **optional**: an absent (`undefined`) set means the
 * leaf predates the feature, so each leaf type falls back to its historical default via
 * `legacyCascade` — Tags/Locations cascaded everything, Media Types/Genres & Moods were exact. The
 * builder seeds a *fresh* leaf with an explicit `[]`, so a newly-selected parent defaults to exact
 * regardless of type; only genuinely old stored conditions hit the legacy fallback.
 */

/** The ids currently shown as "cascade" (checkbox checked): the stored set, or the legacy default. */
export function effectiveCascadeIds(
  selectedIds: string[],
  cascadeIds: string[] | undefined,
  legacyCascade: boolean,
): string[] {
  if (cascadeIds !== undefined) return cascadeIds;
  return legacyCascade ? selectedIds : [];
}

/** Toggle one id's cascade flag, materializing the set from the legacy default on first change. */
export function toggleCascadeId(
  selectedIds: string[],
  cascadeIds: string[] | undefined,
  id: string,
  legacyCascade: boolean,
): string[] {
  const current = new Set(effectiveCascadeIds(selectedIds, cascadeIds, legacyCascade));
  if (current.has(id)) current.delete(id);
  else current.add(id);
  return [...current];
}

/**
 * Keep a cascade set consistent with the selection after ids are added/removed. A `undefined`
 * (legacy) set stays `undefined` — a mere selection change must not flip a legacy leaf's semantics;
 * a concrete set is filtered to the still-selected ids.
 */
export function pruneCascadeIds(
  cascadeIds: string[] | undefined,
  selectedIds: string[],
): string[] | undefined {
  if (cascadeIds === undefined) return undefined;
  const selected = new Set(selectedIds);
  return cascadeIds.filter(id => selected.has(id));
}
