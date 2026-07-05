/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";
import type { FC } from "react";

import { useMemo } from "react";

import { Sparkles } from "lucide-react";

import { useAutofillRules } from "../../../hooks/useAutofill";
import i18n from "../../../i18n";
import { summarizeConditions } from "../../../lib/conditionsSummary";
import { autofillWorkbench } from "../../workbench/autofill";
import { CreateAutofillRule } from "../AutofillRuleForms";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

import { NEW_SENTINEL } from "@/lib/drawerSearch";

function useAutofillList() {
  const {
    data, isLoading, error,
  } = useAutofillRules();
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

const AutofillView: FC<{ id: string }> = ({
  id,
}) => (
  <EntityWorkbenchPanel
    workbench={autofillWorkbench}
    id={id}
    mode="view"
    contentType="autofill"
  />
);

// Creating a rule keeps its monolithic submit form; editing an existing one reuses the workbench.
const AutofillEdit: FC<{ id: string }> = ({
  id,
}) => (id === NEW_SENTINEL
  ? <CreateAutofillRule />
  : (
    <EntityWorkbenchPanel
      workbench={autofillWorkbench}
      id={id}
      mode="edit"
      contentType="autofill"
    />
  ));

export const autofillContentType: PanelContentTypeDef = {
  type: "autofill",
  label: i18n.t("Autofill Rules"),
  singular: i18n.t("Autofill Rule"),
  icon: Sparkles,
  useList: useAutofillList,
  View: AutofillView,
  Edit: AutofillEdit,
};
