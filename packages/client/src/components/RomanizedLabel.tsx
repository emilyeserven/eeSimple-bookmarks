import { LocalizedNameLabel } from "./LocalizedNameLabel";
import { useShowRomanizedByDefault } from "../hooks/useAppSettings";

interface RomanizedLabelProps {
  /** The entity's real name/title. */
  name: string;
  /** The optional romanized form, shown de-emphasized after the primary label. */
  romanized: string | null | undefined;
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
 * Render an entity's name with its romanized form. Reads the user's "Show Romanized by default"
 * preference to decide which is primary; the other is shown de-emphasized after it (omitted when
 * there is no romanized value). Used at every tag-centric render site and the bookmark title.
 *
 * Delegates to `LocalizedNameLabel`/`resolveDisplayNames` (the shared multilingual-names display
 * engine) — the "show romanized first" toggle is expressed as a `preferredLanguage` matching a
 * synthesized romanized row, reproducing this component's original 2-value swap semantics exactly.
 */
export function RomanizedLabel({
  name, romanized, secondaryClassName, stacked = false,
}: RomanizedLabelProps) {
  const showRomanizedFirst = useShowRomanizedByDefault();
  return (
    <LocalizedNameLabel
      names={[]}
      base={name}
      legacyRomanized={romanized}
      preferredLanguage={showRomanizedFirst
        ? {
          id: "legacy-romanized",
        }
        : null}
      secondaryClassName={secondaryClassName}
      stacked={stacked}
    />
  );
}
