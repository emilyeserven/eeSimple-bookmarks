/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";
import type { FC } from "react";

import { useMemo } from "react";

import { LayoutGrid } from "lucide-react";

import { useCardDisplayRules } from "../../../hooks/useCardDisplayRules";
import { conditionsSummaryLabel } from "../../conditions/summarizeConditions";
import { cardDisplayRuleWorkbench } from "../../workbench/cardDisplayRule";
import { CreateCardDisplayRule } from "../CardDisplayRuleForms";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

import { NEW_SENTINEL } from "@/lib/drawerSearch";

function useCardDisplayRuleList() {
  const {
    data, isLoading, error,
  } = useCardDisplayRules();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(rule => ({
      id: rule.id,
      label: rule.name,
      sublabel: rule.isDefault ? "Baseline (always applies)" : conditionsSummaryLabel(rule.conditions),
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only rule view — the same body + shell the main-app card display rule pages render. */
const CardDisplayRuleView: FC<{ id: string }> = ({
  id,
}) => (
  <EntityWorkbenchPanel
    workbench={cardDisplayRuleWorkbench}
    id={id}
    mode="view"
    contentType="card-display-rule"
  />
);

// Creating a rule keeps its monolithic submit form; editing an existing one reuses the workbench.
const CardDisplayRuleEdit: FC<{ id: string }> = ({
  id,
}) => (id === NEW_SENTINEL
  ? <CreateCardDisplayRule />
  : (
    <EntityWorkbenchPanel
      workbench={cardDisplayRuleWorkbench}
      id={id}
      mode="edit"
      contentType="card-display-rule"
    />
  ));

export const cardDisplayRuleContentType: PanelContentTypeDef = {
  type: "card-display-rule",
  label: "Card Display Rules",
  singular: "Card Display Rule",
  icon: LayoutGrid,
  useList: useCardDisplayRuleList,
  View: CardDisplayRuleView,
  Edit: CardDisplayRuleEdit,
};
