import { emptyConditionTree } from "@eesimple/types";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { CardDisplayRuleCard } from "./CardDisplayRuleCard";
import { CardDisplayRuleInspector } from "./CardDisplayRuleInspector";
import { CardDisplayRuleSortableList } from "./CardDisplayRuleSortableList";
import {
  useCardDisplayRules,
  useCreateCardDisplayRule,
} from "../hooks/useCardDisplayRules";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Settings panel: a prioritized, drag-sortable list of card display rules + the pinned Default rule. */
export function CardDisplayRulesSettings() {
  const {
    data: serverRules, isLoading,
  } = useCardDisplayRules();
  const navigate = useNavigate();

  const create = useCreateCardDisplayRule();

  /** Create a blank rule and jump straight to its edit page (create flow, then per-field auto-save). */
  function handleAddRule() {
    create.mutate(
      {
        name: "New rule",
        conditions: emptyConditionTree(),
      },
      {
        onSuccess: (rule) => {
          if (rule.slug) {
            void navigate({
              to: "/card-display-rules/$ruleSlug/edit/general",
              params: {
                ruleSlug: rule.slug,
              },
            });
          }
        },
      },
    );
  }

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

      <Button
        type="button"
        variant="outline"
        disabled={create.isPending}
        onClick={handleAddRule}
      >
        <Plus className="mr-2 size-4" />
        Add rule
      </Button>

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
