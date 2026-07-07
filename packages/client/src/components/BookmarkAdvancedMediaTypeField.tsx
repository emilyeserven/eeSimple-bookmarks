import type { SourceDefaults } from "./BookmarkAdvancedSection";
import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { MediaTypeNode } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { SourceDefaultCheckbox } from "./BookmarkSourceDefaultCheckbox";
import { useEntityCreateOption } from "./useEntityCreateOption";

import { useBuiltInName } from "@/lib/builtInName";
import { mediaTypeNodesToOptions } from "@/lib/comboboxOptions";

interface BookmarkAdvancedMediaTypeFieldProps {
  form: BookmarkFormApi;
  mediaTypes: MediaTypeNode[];
  sourceDefaults: SourceDefaults;
}

/**
 * The Advanced section's Media Type control: a combobox with inline "Create media type", the create
 * modal, and the "set as default media type for <source>" checkbox shown when the source has none.
 */
export function BookmarkAdvancedMediaTypeField({
  form, mediaTypes, sourceDefaults,
}: BookmarkAdvancedMediaTypeFieldProps) {
  const {
    t,
  } = useTranslation();
  const builtInName = useBuiltInName();
  const mediaTypeCreate = useEntityCreateOption("media-type", mediaType => form.setFieldValue("mediaTypeId", mediaType.id));

  return (
    <>
      <form.AppField name="mediaTypeId">
        {field => (
          <field.TreeComboboxField
            label={t("Media type")}
            placeholder={t("No media type")}
            searchPlaceholder={t("Search media types…")}
            emptyText={t("No media types found.")}
            createOption={mediaTypeCreate.createOption}
            options={mediaTypeNodesToOptions(mediaTypes, builtInName)}
          />
        )}
      </form.AppField>

      {mediaTypeCreate.modal}

      {/* "Set as default media type for <source>" — shown when the source has none yet. */}
      {sourceDefaults.showMediaTypeDefault && (
        <form.Subscribe selector={state => state.values.mediaTypeId}>
          {mediaTypeId => (mediaTypeId
            ? (
              <SourceDefaultCheckbox
                checked={sourceDefaults.setMediaType ?? false}
                onCheckedChange={sourceDefaults.onSetMediaType ?? (() => undefined)}
              >
                {t("Set as default media type for {{label}}", {
                  label: sourceDefaults.label,
                })}
              </SourceDefaultCheckbox>
            )
            : null)}
        </form.Subscribe>
      )}
    </>
  );
}
