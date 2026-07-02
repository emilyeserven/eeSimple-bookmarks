import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { Publisher } from "@eesimple/types";

import { useEntityCreateOption } from "./useEntityCreateOption";

interface BookmarkAdvancedPublisherFieldProps {
  form: BookmarkFormApi;
  publishers: Publisher[];
}

/**
 * The Advanced section's Publisher control: a combobox with inline "Create publisher" and the
 * create modal.
 */
export function BookmarkAdvancedPublisherField({
  form, publishers,
}: BookmarkAdvancedPublisherFieldProps) {
  const publisherCreate = useEntityCreateOption("publisher", publisher => form.setFieldValue("publisherId", publisher.id));

  return (
    <>
      <form.AppField name="publisherId">
        {field => (
          <field.ComboboxField
            label="Publisher"
            placeholder="No publisher"
            searchPlaceholder="Search publishers…"
            emptyText="No publishers found."
            createOption={publisherCreate.createOption}
            options={publishers.map(p => ({
              value: p.id,
              label: p.name,
            }))}
          />
        )}
      </form.AppField>
      {publisherCreate.modal}
    </>
  );
}
