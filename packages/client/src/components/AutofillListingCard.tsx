import type { AutofillRule } from "@eesimple/types";

import { AutofillRuleListItem } from "./AutofillRuleListItem";
import { useCategories } from "../hooks/useCategories";

interface AutofillListingCardProps {
  rule: AutofillRule;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: (shiftKey?: boolean) => void;
  inSelectionMode?: boolean;
}

/**
 * Card for the unscoped Autofill Rules listing (`ListingScaffold`'s `renderListItem`). Resolves the
 * categories itself — the shared `AutofillRuleListItem` needs them for the "sets category" badge —
 * so the listing config's render callback stays hook-free.
 */
export function AutofillListingCard({
  rule, ...rest
}: AutofillListingCardProps) {
  const {
    data: categories,
  } = useCategories();

  return (
    <AutofillRuleListItem
      rule={rule}
      categories={categories ?? []}
      {...rest}
    />
  );
}
