import type { SourceDefaults } from "./BookmarkAdvancedSection";
import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { MediaTypeNode } from "@eesimple/types";

import { AddMediaTypeModal } from "./AddMediaTypeModal";
import { SourceDefaultCheckbox } from "./BookmarkSourceDefaultCheckbox";

import { mediaTypeTreeComboboxOptions } from "@/lib/comboboxOptions";

interface BookmarkAdvancedMediaTypeFieldProps {
  form: BookmarkFormApi;
  mediaTypes: MediaTypeNode[];
  sourceDefaults: SourceDefaults;
  addMediaTypeOpen: boolean;
  onAddMediaTypeOpenChange: (open: boolean) => void;
}

/**
 * The Advanced section's Media Type control: a combobox with inline "Create media type", the create
 * modal, and the "set as default media type for <source>" checkbox shown when the source has none.
 */
export function BookmarkAdvancedMediaTypeField({
  form, mediaTypes, sourceDefaults, addMediaTypeOpen, onAddMediaTypeOpenChange,
}: BookmarkAdvancedMediaTypeFieldProps) {
  return (
    <>
      <form.AppField name="mediaTypeId">
        {field => (
          <field.ComboboxField
            label="Media type"
            placeholder="No media type"
            searchPlaceholder="Search media types…"
            emptyText="No media types found."
            createOption={{
              label: "Create media type",
              onSelect: () => onAddMediaTypeOpenChange(true),
            }}
            options={mediaTypeTreeComboboxOptions(mediaTypes)}
          />
        )}
      </form.AppField>

      <AddMediaTypeModal
        open={addMediaTypeOpen}
        onOpenChange={onAddMediaTypeOpenChange}
        onCreated={mediaType => form.setFieldValue("mediaTypeId", mediaType.id)}
      />

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
