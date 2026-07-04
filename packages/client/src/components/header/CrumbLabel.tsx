import type { SwitcherSpec } from "@/components/BreadcrumbSwitcher";

import { useTranslation } from "react-i18next";

import { LocalizedNameLabel } from "@/components/LocalizedNameLabel";
import { useShowRomanizedByDefault } from "@/hooks/useAppSettings";

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
 *
 * Delegates to `LocalizedNameLabel` (the shared multilingual-names display engine) — see
 * `RomanizedLabel` for how the toggle maps onto a `preferredLanguage`.
 */
export function CrumbLabel({
  label,
  romanizedLabel,
}: {
  label: string;
  romanizedLabel?: string | null;
}) {
  const {
    t,
  } = useTranslation();
  const showRomanizedFirst = useShowRomanizedByDefault();
  // Translate the static label before it's resolved against the (never-translated) romanized entity
  // data — an untranslated label (e.g. a real entity name) simply falls through to itself.
  const translatedLabel = t(label);
  return (
    <LocalizedNameLabel
      names={[]}
      base={translatedLabel}
      legacyRomanized={romanizedLabel}
      preferredLanguage={showRomanizedFirst
        ? {
          id: "legacy-romanized",
        }
        : null}
      secondaryClassName="text-xs/tight"
      stacked
    />
  );
}
