import type { CardDisplayRule, UpdateCardDisplayRuleInput } from "@eesimple/types";

import { CardDisplayRuleDisplaySettings } from "./CardDisplayRuleDisplaySettings";
import { CardDisplayRulePreview } from "./CardDisplayRulePreview";
import { useCardDisplayRuleDisplay } from "./useCardDisplayRuleDisplay";

const LABELS: Partial<Record<keyof UpdateCardDisplayRuleInput, string>> = {
  fieldZones: "Card fields",
  cardZoneLayouts: "Card layout",
  imageMode: "Image aspect",
  imageVisibility: "Image visibility",
  imageLayout: "Image layout",
  hideWebsiteForYouTube: "Website pill on YouTube",
};

interface Props {
  entity: CardDisplayRule;
}

/**
 * Edit a card display rule's per-card display overrides (field zones, layout, image presentation). Each
 * changed attribute auto-saves on change (no Save button) with a field-named toast; a live card preview
 * sits beside the controls. Unset attributes inherit from lower-priority rules / the Default.
 */
export function CardDisplayRuleDisplayForm({
  entity: rule,
}: Props) {
  const {
    properties, display, handleChange,
  } = useCardDisplayRuleDisplay(rule, LABELS);

  return (
    <div
      className="
        gap-6
        md:grid md:grid-cols-[1fr_minmax(0,22rem)] md:items-start
      "
    >
      <div
        className="
          md:max-h-[calc(100vh-16rem)] md:min-h-0 md:overflow-y-auto md:pr-2
        "
      >
        <CardDisplayRuleDisplaySettings
          idPrefix={`rule-${rule.id}`}
          value={display}
          onChange={handleChange}
          properties={properties}
          isDefault={rule.isDefault}
        />
      </div>
      <div
        className="
          mt-6
          md:sticky md:top-4 md:mt-0 md:max-h-[calc(100vh-16rem)] md:self-start
          md:overflow-y-auto
        "
      >
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Card preview</h3>
            <p className="text-xs text-muted-foreground">
              How a matching bookmark card looks with these display settings.
            </p>
          </div>
          <CardDisplayRulePreview
            display={display}
            conditions={rule.conditions}
            isDefault={rule.isDefault}
            currentRuleId={rule.id}
          />
        </section>
      </div>
    </div>
  );
}
