import type { RuleDisplayValue } from "../components/CardDisplayRuleDisplaySettings";
import type { CardDisplayRule } from "@eesimple/types";

import { defaultCardZoneLayouts } from "@eesimple/types";

/**
 * Project a rule's stored display columns into the editor's {@link RuleDisplayValue} shape. A
 * non-default rule keeps `null` ("inherit") per attribute; the Default rule is fully concrete (it is
 * the baseline every other rule falls back to). Mirrors the seeded Default in `ensureDefaultCardDisplayRule`.
 */
export function ruleToDisplay(rule: CardDisplayRule): RuleDisplayValue {
  return {
    fieldZones: rule.fieldZones ?? null,
    cardZoneLayouts: rule.cardZoneLayouts ?? (rule.isDefault ? defaultCardZoneLayouts() : null),
    imageMode: rule.imageMode ?? (rule.isDefault ? "natural" : null),
    imageVisibility: rule.imageVisibility ?? (rule.isDefault ? "shown" : null),
    imageLayout: rule.imageLayout ?? (rule.isDefault ? "above" : null),
    hideWebsiteForYouTube: rule.hideWebsiteForYouTube ?? (rule.isDefault ? false : null),
  };
}
