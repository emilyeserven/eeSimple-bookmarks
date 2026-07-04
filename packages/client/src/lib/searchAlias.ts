import type { EntityName } from "@eesimple/types";

/**
 * Build a combobox `searchAlias` from all of an entity's searchable name variants — its legacy
 * romanized form plus every language-labelled `names` value — so typing any variant (e.g. either
 * エヴァンゲリオン or Evangelion) matches the same option. Deduped, blank-filtered, space-joined;
 * `undefined` when there is nothing extra to match on.
 */
export function buildSearchAlias(
  romanized: string | null | undefined,
  names: EntityName[] | null | undefined,
): string | undefined {
  const parts = [romanized ?? "", ...(names ?? []).map(name => name.value)]
    .map(part => part.trim())
    .filter(part => part.length > 0);
  const unique = [...new Set(parts)];
  return unique.length > 0 ? unique.join(" ") : undefined;
}
