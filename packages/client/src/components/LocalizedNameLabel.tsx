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
  /** Which language to prefer for the secondary name, when no primary override applies. */
  secondaryLanguage?: PreferredLanguage | null;
  /** Fallback language for the secondary name when no preferred/secondary match; defaults to English. */
  fallbackLanguage?: PreferredLanguage | null;
  /** Extra classes for the de-emphasized secondary span. */
  secondaryClassName?: string;
  /**
   * When true, stack the secondary form on its own line *below* the primary instead of inline
   * after it. Used where the names are long enough to warrant a two-line layout (e.g. location
   * listing cards).
   */
  stacked?: boolean;
  /**
   * When stacked, render each line single-line + ellipsis (`truncate`) instead of wrapping onto
   * multiple lines. Used by the header breadcrumb, whose fixed-height strip must not grow.
   */
  truncate?: boolean;
}

/**
 * Render an entity's resolved primary/secondary display name via the shared multilingual
 * `resolveDisplayNames` helper (`@eesimple/types`). Falls back to a synthesized row from
 * `legacyRomanized` when `names` is empty, so display stays stable whether or not `entity_names`
 * rows have been backfilled yet. `CrumbLabel` delegates to this internally.
 */
export function LocalizedNameLabel({
  names, base, legacyRomanized, preferredLanguage, secondaryLanguage, fallbackLanguage, secondaryClassName, stacked = false, truncate = false,
}: LocalizedNameLabelProps) {
  const {
    primary, secondary,
  } = resolveDisplayNames(namesWithLegacyFallback(names, legacyRomanized), preferredLanguage, base, secondaryLanguage, fallbackLanguage);

  if (stacked) {
    const lineClass = truncate ? "truncate" : "wrap-break-word";
    return (
      <span className="flex min-w-0 flex-col">
        <span className={lineClass}>{primary}</span>
        {secondary
          ? (
            <span
              className={cn(`
                text-sm font-normal text-muted-foreground
                ${lineClass}
              `, secondaryClassName)}
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

interface LocalizedNameSummaryOption {
  value: string;
  label: string;
  names?: EntityName[];
}

interface LocalizedNameSummaryProps {
  /** The selected options to summarize, each rendered via {@link LocalizedNameLabel}. */
  options: LocalizedNameSummaryOption[];
  secondaryLanguage?: PreferredLanguage | null;
  fallbackLanguage?: PreferredLanguage | null;
}

/**
 * Render a comma-separated summary of selected options for a multi-select combobox trigger, each
 * option resolved through {@link LocalizedNameLabel} so the collapsed trigger shows the same
 * primary + de-emphasized secondary display name as the open dropdown rows.
 */
export function LocalizedNameSummary({
  options, secondaryLanguage, fallbackLanguage,
}: LocalizedNameSummaryProps) {
  return (
    <>
      {options.map((option, index) => (
        <span key={option.value}>
          {index > 0 ? ", " : null}
          <LocalizedNameLabel
            names={option.names ?? []}
            base={option.label}
            secondaryLanguage={secondaryLanguage}
            fallbackLanguage={fallbackLanguage}
          />
        </span>
      ))}
    </>
  );
}
