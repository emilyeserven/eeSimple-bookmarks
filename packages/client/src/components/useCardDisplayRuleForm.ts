import type { RuleDisplayValue } from "./CardDisplayRuleDisplaySettings";
import type { CardDisplayRule, ConditionTree } from "@eesimple/types";

import { useRef, useState } from "react";

import { defaultCardZoneLayouts, emptyConditionTree } from "@eesimple/types";

import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";

export interface CardDisplayRuleFormValues {
  name: string;
  description: string | null;
  conditions: ConditionTree;
  display: RuleDisplayValue;
}

function initialFromRule(rule?: CardDisplayRule, seedConditions?: ConditionTree): CardDisplayRuleFormValues {
  return {
    name: rule?.name ?? "",
    description: rule?.description ?? "",
    conditions: rule?.conditions ?? seedConditions ?? emptyConditionTree(),
    display: {
      fieldZones: rule?.fieldZones ?? null,
      cardZoneLayouts: rule?.cardZoneLayouts ?? (rule?.isDefault ? defaultCardZoneLayouts() : null),
      imageMode: rule?.imageMode ?? (rule?.isDefault ? "natural" : null),
      imageVisibility: rule?.imageVisibility ?? (rule?.isDefault ? "shown" : null),
      imageLayout: rule?.imageLayout ?? (rule?.isDefault ? "above" : null),
      hideWebsiteForYouTube: rule?.hideWebsiteForYouTube ?? (rule?.isDefault ? false : null),
    },
  };
}

/** The three entity lists the form needs, each defaulted to an empty array so the JSX stays terse. */
function useCardDisplayRuleFormData() {
  const {
    data: categories,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: tagTree,
  } = useTagTree();
  return {
    categories: categories ?? [],
    properties: properties ?? [],
    tagTree: tagTree ?? [],
  };
}

interface UseCardDisplayRuleFormArgs {
  rule?: CardDisplayRule;
  seedConditions?: ConditionTree;
  onSave?: (values: CardDisplayRuleFormValues) => void;
  onChange?: (values: CardDisplayRuleFormValues) => void;
}

/**
 * State + data + handler orchestration for {@link CardDisplayRuleForm}: the working form values, the
 * three picker entity lists, the `setFields`/`setDisplay` mutators (mirrored into a ref so handlers
 * read the latest value), and the explicit-save submit handler.
 */
export function useCardDisplayRuleForm({
  rule, seedConditions, onSave, onChange,
}: UseCardDisplayRuleFormArgs) {
  const initialValues = initialFromRule(rule, seedConditions);
  const [values, setValues] = useState<CardDisplayRuleFormValues>(initialValues);
  const valuesRef = useRef<CardDisplayRuleFormValues>(initialValues);

  const {
    categories, properties, tagTree,
  } = useCardDisplayRuleFormData();

  function setFields(patch: Partial<CardDisplayRuleFormValues>): void {
    const next = {
      ...valuesRef.current,
      ...patch,
    };
    valuesRef.current = next;
    setValues(next);
    onChange?.(next);
  }

  function setDisplay(patch: Partial<RuleDisplayValue>): void {
    setFields({
      display: {
        ...valuesRef.current.display,
        ...patch,
      },
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave?.({
      ...valuesRef.current,
      name: valuesRef.current.name.trim(),
      description: valuesRef.current.description?.trim() || null,
    });
  }

  return {
    values,
    categories,
    properties,
    tagTree,
    setFields,
    setDisplay,
    handleSubmit,
  };
}
