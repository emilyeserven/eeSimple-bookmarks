import type { RelationshipTypeCondition } from "@eesimple/types";

import { MultiCombobox } from "../MultiCombobox";

import { useRelationshipTypes } from "@/hooks/useRelationshipTypes";

interface RelationshipTypeConditionEditorProps {
  value: RelationshipTypeCondition;
  onChange: (next: RelationshipTypeCondition) => void;
}

/** Controlled multi-select editor for a "has a relationship of type …" condition. */
export function RelationshipTypeConditionEditor({
  value, onChange,
}: RelationshipTypeConditionEditorProps) {
  const {
    data: relationshipTypes = [], isLoading,
  } = useRelationshipTypes();

  return (
    <MultiCombobox
      aria-label="Relationship Types"
      placeholder={isLoading ? "Loading…" : "Any relationship type"}
      searchPlaceholder="Search relationship types…"
      emptyText="No relationship types found."
      options={relationshipTypes.map(rt => ({
        value: rt.id,
        label: rt.name,
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
