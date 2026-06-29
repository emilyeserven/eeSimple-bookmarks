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
}

/**
 * Render an entity's name with its romanized form. Reads the user's "Show Romanized by default"
 * preference to decide which is primary; the other is shown de-emphasized after it (omitted when
 * there is no romanized value). Used at every tag-centric render site and the bookmark title.
 */
export function RomanizedLabel({
  name, romanized, secondaryClassName,
}: RomanizedLabelProps) {
  const showRomanizedFirst = useShowRomanizedByDefault();
  const {
    primary, secondary,
  } = orderRomanized(name, romanized, showRomanizedFirst);
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
