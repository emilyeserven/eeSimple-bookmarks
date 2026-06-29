import { useShowRomanizedByDefault } from "../hooks/useAppSettings";
import { orderRomanized } from "../lib/romanized";

import { cn } from "@/lib/utils";

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
 */
export function RomanizedLabel({
  name, romanized, secondaryClassName, stacked = false,
}: RomanizedLabelProps) {
  const showRomanizedFirst = useShowRomanizedByDefault();
  const {
    primary, secondary,
  } = orderRomanized(name, romanized, showRomanizedFirst);

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
