import type { SwitcherSpec } from "@/components/BreadcrumbSwitcher";
import type { EntityName } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { LocalizedNameLabel } from "@/components/LocalizedNameLabel";

export interface BreadcrumbSegment {
  label: string;
  /** Optional multilingual names, resolved to a secondary form rendered stacked beneath the label. */
  names?: EntityName[];
  href?: string;
  /** When set, a hover-revealed switcher button beside the label switches to a sibling entity. */
  switcher?: SwitcherSpec;
  /** Allow this link crumb to shrink and truncate. Set on entity-name crumbs that can be long. */
  truncatable?: boolean;
}

/**
 * A crumb's text: the primary label with its resolved secondary name form stacked beneath it in
 * subtle muted text. With no secondary form it collapses to the single label.
 *
 * Delegates to `LocalizedNameLabel` (the shared multilingual-names display engine).
 */
export function CrumbLabel({
  label,
  names,
}: {
  label: string;
  names?: EntityName[];
}) {
  const {
    t,
  } = useTranslation();
  // Translate the static label before it's resolved against the (never-translated) entity names —
  // an untranslated label (e.g. a real entity name) simply falls through to itself.
  const translatedLabel = t(label);
  return (
    <LocalizedNameLabel
      names={names ?? []}
      base={translatedLabel}
      secondaryClassName="text-xs/tight"
      stacked
    />
  );
}
