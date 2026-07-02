import type { SourceDefaults } from "./BookmarkAdvancedSection";
import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { MediaTypeNode } from "@eesimple/types";

import { SourceDefaultCheckbox } from "./BookmarkSourceDefaultCheckbox";
import { useEntityCreateOption } from "./useEntityCreateOption";

import { mediaTypeTreeComboboxOptions } from "@/lib/comboboxOptions";

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
  const mediaTypeCreate = useEntityCreateOption("media-type", mediaType => form.setFieldValue("mediaTypeId", mediaType.id));

  return (
    <>
      <form.AppField name="mediaTypeId">
        {field => (
          <field.ComboboxField
            label="Media type"
            placeholder="No media type"
            searchPlaceholder="Search media types…"
            emptyText="No media types found."
            createOption={mediaTypeCreate.createOption}
            options={mediaTypeTreeComboboxOptions(mediaTypes)}
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
                checked={sourceDefaults.setMediaType}
                onCheckedChange={sourceDefaults.onSetMediaType}
              >
                Set as default media type for
                {" "}
                {sourceDefaults.label}
              </SourceDefaultCheckbox>
            )
            : null)}
        </form.Subscribe>
      )}
    </>
  );
}
