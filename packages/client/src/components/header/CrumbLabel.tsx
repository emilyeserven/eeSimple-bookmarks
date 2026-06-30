import type { SwitcherSpec } from "@/components/BreadcrumbSwitcher";

import { useShowRomanizedByDefault } from "@/hooks/useAppSettings";
import { orderRomanized } from "@/lib/romanized";

export interface BreadcrumbSegment {
  label: string;
  /** Optional romanized form, rendered stacked beneath the label in subtle text. */
  romanizedLabel?: string | null;
  href?: string;
  /** When set, a hover-revealed switcher button beside the label switches to a sibling entity. */
  switcher?: SwitcherSpec;
  /** Allow this link crumb to shrink and truncate. Set on entity-name crumbs that can be long. */
  truncatable?: boolean;
}

/**
 * A crumb's text: the primary label with its romanized form stacked beneath it in subtle muted
 * text. Which form is primary follows the user's "Show romanized by default" preference (same as
 * every other romanized render site). With no romanized value it collapses to the single label.
 */
export function CrumbLabel({
  label,
  romanizedLabel,
}: {
  label: string;
  romanizedLabel?: string | null;
}) {
  const showRomanizedFirst = useShowRomanizedByDefault();
  const {
    primary, secondary,
  } = orderRomanized(label, romanizedLabel, showRomanizedFirst);
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate">{primary}</span>
      {secondary
        ? (
          <span
            className="truncate text-xs/tight font-normal text-muted-foreground"
          >
            {secondary}
          </span>
        )
        : null}
    </span>
  );
}
