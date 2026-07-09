import type { MediaTypeCondition } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { TreeMultiCombobox } from "../TreeMultiCombobox";
import { useEntityCreateOption } from "../useEntityCreateOption";

import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { useBuiltInName } from "@/lib/builtInName";
import { mediaTypeNodesToOptions } from "@/lib/comboboxOptions";
import { effectiveCascadeIds, pruneCascadeIds, toggleCascadeId } from "@/lib/conditionCascade";

interface MediaTypeConditionEditorProps {
  value: MediaTypeCondition;
  onChange: (next: MediaTypeCondition) => void;
}

/** Controlled multi-select editor for a "media type is one of …" condition. */
export function MediaTypeConditionEditor({
  value, onChange,
}: MediaTypeConditionEditorProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: mediaTypeTree = [], isLoading,
  } = useMediaTypeTree();
  const builtInName = useBuiltInName();
  const mediaTypeCreate = useEntityCreateOption("media-type", mediaType =>
    onChange({
      ...value,
      mediaTypeIds: [...value.mediaTypeIds, mediaType.id],
    }));

  return (
    <>
      <TreeMultiCombobox
        aria-label={t("Media Types")}
        placeholder={isLoading ? t("Loading…") : t("Any media type")}
        searchPlaceholder={t("Search media types…")}
        emptyText={t("No media types found.")}
        options={mediaTypeNodesToOptions(mediaTypeTree, builtInName)}
        values={value.mediaTypeIds}
        onValuesChange={mediaTypeIds =>
          onChange({
            ...value,
            mediaTypeIds,
            cascadeMediaTypeIds: pruneCascadeIds(value.cascadeMediaTypeIds, mediaTypeIds),
          })}
        cascadeValues={effectiveCascadeIds(value.mediaTypeIds, value.cascadeMediaTypeIds, false)}
        onToggleCascade={id =>
          onChange({
            ...value,
            cascadeMediaTypeIds: toggleCascadeId(value.mediaTypeIds, value.cascadeMediaTypeIds, id, false),
          })}
        createOption={mediaTypeCreate.createOption}
      />
      {mediaTypeCreate.modal}
    </>
  );
}
