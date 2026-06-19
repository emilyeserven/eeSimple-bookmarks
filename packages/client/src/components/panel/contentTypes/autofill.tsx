/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";
import type { FC } from "react";

import { useMemo } from "react";

import { Sparkles } from "lucide-react";

import { useAutofillRules } from "../../../hooks/useAutofill";
import { summarizeConditions } from "../../../lib/conditionsSummary";
import { AutofillRulePanel, ViewAutofillRule } from "../AutofillRulePanel";

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
}) => <ViewAutofillRule ruleId={id} />;
const AutofillEdit: FC<{ id: string }> = ({
  id,
}) => <AutofillRulePanel ruleId={id} />;

export const autofillContentType: PanelContentTypeDef = {
  type: "autofill",
  label: "Autofill Rules",
  singular: "Autofill Rule",
  icon: Sparkles,
  useList: useAutofillList,
  View: AutofillView,
  Edit: AutofillEdit,
};
