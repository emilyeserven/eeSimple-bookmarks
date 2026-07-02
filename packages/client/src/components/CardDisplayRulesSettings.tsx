import { CardDisplayRuleCard } from "./CardDisplayRuleCard";
import { CardDisplayRuleInspector } from "./CardDisplayRuleInspector";
import { CardDisplayRuleSortableList } from "./CardDisplayRuleSortableList";
import { useCardDisplayRules } from "../hooks/useCardDisplayRules";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Settings panel: a prioritized, drag-sortable list of card display rules + the pinned Default rule.
 * Rule creation lives on the header create button (registered by the /card-display-rules route).
 */
export function CardDisplayRulesSettings() {
  const {
    data: serverRules, isLoading,
  } = useCardDisplayRules();

  const defaultRule = serverRules?.find(rule => rule.isDefault);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Inspect a bookmark</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDisplayRuleInspector />
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Rules change how bookmark cards display based on their category, media type, website, tags, and
        more. Higher rules win; each card falls back to the Default rule at the bottom.
      </p>

      {isLoading
        ? <p className="text-sm text-muted-foreground">Loading…</p>
        : null}

      <CardDisplayRuleSortableList
        serverRules={serverRules}
        isLoading={isLoading}
      />

      {defaultRule
        ? (
          <div className="space-y-3 pt-2">
            <CardDisplayRuleCard rule={defaultRule} />
          </div>
        )
        : null}
    </div>
  );
}
