import type { MediaTypeCondition } from "@eesimple/types";

import { EntityMultiSelectCondition } from "./EntityMultiSelectCondition";

import { useMediaTypes } from "@/hooks/useMediaTypes";

interface MediaTypeConditionEditorProps {
  value: MediaTypeCondition;
  onChange: (next: MediaTypeCondition) => void;
}

/** Controlled multi-select editor for a "media type is one of …" condition. */
export function MediaTypeConditionEditor({
  value, onChange,
}: MediaTypeConditionEditorProps) {
  const {
    data: mediaTypes = [], isLoading,
  } = useMediaTypes();

  return (
    <EntityMultiSelectCondition
      ariaLabel="Media Types"
      placeholder={isLoading ? "Loading…" : "Any media type"}
      searchPlaceholder="Search media types…"
      emptyText="No media types found."
      options={mediaTypes.map(mt => ({
        value: mt.id,
        label: mt.name,
      }))}
      values={value.mediaTypeIds}
      onValuesChange={mediaTypeIds =>
        onChange({
          ...value,
          mediaTypeIds,
        })}
    />
  );
}
