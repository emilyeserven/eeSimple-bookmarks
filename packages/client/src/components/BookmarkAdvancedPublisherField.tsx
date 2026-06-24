import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { Publisher } from "@eesimple/types";

import { AddPublisherModal } from "./AddPublisherModal";

interface BookmarkAdvancedPublisherFieldProps {
  form: BookmarkFormApi;
  publishers: Publisher[];
  addPublisherOpen: boolean;
  onAddPublisherOpenChange: (open: boolean) => void;
}

/**
 * The Advanced section's Publisher control: a combobox with inline "Create publisher" and the
 * create modal.
 */
export function BookmarkAdvancedPublisherField({
  form, publishers, addPublisherOpen, onAddPublisherOpenChange,
}: BookmarkAdvancedPublisherFieldProps) {
  return (
    <>
      <form.AppField name="publisherId">
        {field => (
          <field.ComboboxField
            label="Publisher"
            placeholder="No publisher"
            searchPlaceholder="Search publishers…"
            emptyText="No publishers found."
            createOption={{
              label: "Create publisher",
              onSelect: () => onAddPublisherOpenChange(true),
            }}
            options={publishers.map(p => ({
              value: p.id,
              label: p.name,
            }))}
          />
        )}
      </form.AppField>
      <AddPublisherModal
        open={addPublisherOpen}
        onOpenChange={onAddPublisherOpenChange}
        onCreated={publisher => form.setFieldValue("publisherId", publisher.id)}
      />
    </>
  );
}
