import type { RelationshipTypeCondition } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { EntityMultiSelectCondition } from "./EntityMultiSelectCondition";

import { useRelationshipTypes } from "@/hooks/useRelationshipTypes";
import { useBuiltInName } from "@/lib/builtInName";

interface RelationshipTypeConditionEditorProps {
  value: RelationshipTypeCondition;
  onChange: (next: RelationshipTypeCondition) => void;
}

/** Controlled multi-select editor for a "has a relationship of type …" condition. */
export function RelationshipTypeConditionEditor({
  value, onChange,
}: RelationshipTypeConditionEditorProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: relationshipTypes = [], isLoading,
  } = useRelationshipTypes();
  const builtInName = useBuiltInName();

  return (
    <EntityMultiSelectCondition
      ariaLabel={t("Relationship Types")}
      placeholder={isLoading ? t("Loading…") : t("Any relationship type")}
      searchPlaceholder={t("Search relationship types…")}
      emptyText={t("No relationship types found.")}
      options={relationshipTypes.filter(rt => !rt.hidden).map(rt => ({
        value: rt.id,
        label: builtInName(rt),
        searchAlias: rt.builtIn ? rt.name : undefined,
      }))}
      values={value.relationshipTypeIds}
      onValuesChange={relationshipTypeIds =>
        onChange({
          ...value,
          relationshipTypeIds,
        })}
    />
  );
}
