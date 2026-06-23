/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";
import type { FC } from "react";

import { useMemo } from "react";

import { Filter } from "lucide-react";

import { useImportRules } from "../../../hooks/useImportRules";
import { summarizeConditions } from "../../../lib/conditionsSummary";
import { importRuleWorkbench } from "../../workbench/importRule";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";
import { CreateImportRule } from "../ImportRuleForms";

import { NEW_SENTINEL } from "@/lib/drawerSearch";

function useImportRuleList() {
  const {
    data, isLoading, error,
  } = useImportRules();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(rule => ({
      id: rule.id,
      label: rule.name,
      sublabel: summarizeConditions(rule.conditions),
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

const ImportRuleView: FC<{ id: string }> = ({
  id,
}) => (
  <EntityWorkbenchPanel
    workbench={importRuleWorkbench}
    id={id}
    mode="view"
  />
);

const ImportRuleEdit: FC<{ id: string }> = ({
  id,
}) => (id === NEW_SENTINEL
  ? <CreateImportRule />
  : (
    <EntityWorkbenchPanel
      workbench={importRuleWorkbench}
      id={id}
      mode="edit"
    />
  ));

export const importRuleContentType: PanelContentTypeDef = {
  type: "import-rule",
  label: "Import Rules",
  singular: "Import Rule",
  icon: Filter,
  useList: useImportRuleList,
  View: ImportRuleView,
  Edit: ImportRuleEdit,
};
