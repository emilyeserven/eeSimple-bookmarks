import type { MediaTypeCondition } from "@eesimple/types";

import { useState } from "react";

import { AddMediaTypeModal } from "../AddMediaTypeModal";
import { MultiCombobox } from "../MultiCombobox";

import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { mediaTypeTreeComboboxOptions } from "@/lib/comboboxOptions";

interface MediaTypeConditionEditorProps {
  value: MediaTypeCondition;
  onChange: (next: MediaTypeCondition) => void;
}

/** Controlled multi-select editor for a "media type is one of …" condition. */
export function MediaTypeConditionEditor({
  value, onChange,
}: MediaTypeConditionEditorProps) {
  const {
    data: mediaTypeTree = [], isLoading,
  } = useMediaTypeTree();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <MultiCombobox
        aria-label="Media Types"
        placeholder={isLoading ? "Loading…" : "Any media type"}
        searchPlaceholder="Search media types…"
        emptyText="No media types found."
        options={mediaTypeTreeComboboxOptions(mediaTypeTree)}
        values={value.mediaTypeIds}
        onValuesChange={mediaTypeIds =>
          onChange({
            ...value,
            mediaTypeIds,
          })}
        createOption={{
          label: "Create media type",
          onSelect: () => setAddOpen(true),
        }}
      />
      <AddMediaTypeModal
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </>
  );
}
