import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { Person } from "@eesimple/types";

import { MultiCombobox } from "./MultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";

import { Label } from "@/components/ui/label";

interface BookmarkPeopleFieldProps {
  form: BookmarkFormApi;
  people: Person[];
}

/**
 * The People multi-combobox with inline "Create person" and its create modal. Extracted from the
 * Advanced section so it can be placed independently via the standard-field zone.
 */
export function BookmarkPeopleField({
  form, people,
}: BookmarkPeopleFieldProps) {
  const personCreate = useEntityCreateOption("person", (person) => {
    const current = form.getFieldValue("personIds");
    if (!current.includes(person.id)) form.setFieldValue("personIds", [...current, person.id]);
  });

  return (
    <>
      <form.Field name="personIds">
        {field => (
          <div className="space-y-1">
            <Label>People</Label>
            <MultiCombobox
              options={people.map(a => ({
                value: a.id,
                label: a.name,
              }))}
              values={field.state.value}
              onValuesChange={field.handleChange}
              placeholder="Select people…"
              searchPlaceholder="Search people…"
              emptyText="No people found."
              createOption={personCreate.createOption}
            />
          </div>
        )}
      </form.Field>
      {personCreate.modal}
    </>
  );
}
