import type { MediaTypeCondition } from "@eesimple/types";

import { TreeMultiCombobox } from "../TreeMultiCombobox";
import { useEntityCreateOption } from "../useEntityCreateOption";

import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { mediaTypeNodesToOptions } from "@/lib/comboboxOptions";

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
  const mediaTypeCreate = useEntityCreateOption("media-type", mediaType =>
    onChange({
      ...value,
      mediaTypeIds: [...value.mediaTypeIds, mediaType.id],
    }));

  return (
    <>
      <TreeMultiCombobox
        aria-label="Media Types"
        placeholder={isLoading ? "Loading…" : "Any media type"}
        searchPlaceholder="Search media types…"
        emptyText="No media types found."
        options={mediaTypeNodesToOptions(mediaTypeTree)}
        values={value.mediaTypeIds}
        onValuesChange={mediaTypeIds =>
          onChange({
            ...value,
            mediaTypeIds,
          })}
        createOption={mediaTypeCreate.createOption}
      />
      {mediaTypeCreate.modal}
    </>
  );
}
