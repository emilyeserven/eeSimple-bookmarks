import type { EntityName, PreferredLanguage } from "@eesimple/types";

import { namesWithLegacyFallback, resolveDisplayNames } from "@eesimple/types";

import { cn } from "@/lib/utils";

interface LocalizedNameLabelProps {
  /** The entity's multilingual names, when hydrated (empty until #966 backfills existing rows). */
  names: EntityName[];
  /** The entity's base name/title — the ultimate fallback, and the "canonical" value when no name is flagged primary. */
  base: string;
  /** The legacy romanized scalar, used to synthesize a name row when `names` is empty so display stays stable regardless of backfill timing. */
  legacyRomanized?: string | null;
  /** Which language to prefer as primary; `null`/omitted until the interface-language setting exists. */
  preferredLanguage?: PreferredLanguage | null;
  /** Extra classes for the de-emphasized secondary span. */
  secondaryClassName?: string;
  /**
   * When true, stack the secondary form on its own line *below* the primary instead of inline
   * after it. Used where the names are long enough to warrant a two-line layout (e.g. location
   * listing cards).
   */
  stacked?: boolean;
}

/**
 * Render an entity's resolved primary/secondary display name via the shared multilingual
 * `resolveDisplayNames` helper (`@eesimple/types`). Falls back to a synthesized row from
 * `legacyRomanized` when `names` is empty, so display stays stable whether or not `entity_names`
 * rows have been backfilled yet. `RomanizedLabel`/`CrumbLabel` delegate to this internally.
 */
export function LocalizedNameLabel({
  names, base, legacyRomanized, preferredLanguage, secondaryClassName, stacked = false,
}: LocalizedNameLabelProps) {
  const {
    primary, secondary,
  } = resolveDisplayNames(namesWithLegacyFallback(names, legacyRomanized), preferredLanguage, base);

  if (stacked) {
    return (
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{primary}</span>
        {secondary
          ? (
            <span
              className={cn("truncate text-sm font-normal text-muted-foreground", secondaryClassName)}
            >
              {secondary}
            </span>
          )
          : null}
      </span>
    );
  }

  return (
    <>
      {primary}
      {secondary
        ? (
          <span className={cn("ml-1.5 font-normal text-muted-foreground", secondaryClassName)}>
            {secondary}
          </span>
        )
        : null}
    </>
  );
}
