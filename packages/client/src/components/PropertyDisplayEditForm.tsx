import type { PropertyFormApi } from "./propertyFormSchema";
import type { CustomProperty, PropertyGroup, UpdateCustomPropertyInput } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { PropertyDisplaySection, propertySchema, valuesFromProperty } from "./propertyFormParts";
import { useUpdateCustomProperty } from "../hooks/useCustomProperties";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useAppForm } from "../lib/form";

const LABELS: Partial<Record<keyof UpdateCustomPropertyInput, string>> = {
  propertyGroupId: "Group",
  hiddenFromForm: "Main bookmark form",
  showInForm: "Show outside Advanced area",
  showInListings: "Bookmark listings",
  editableOnCard: "Card editing",
};

/** The display form values that auto-save, mapped to their `UpdateCustomPropertyInput` payload key. */
type DisplayWatched = Pick<
  ReturnType<typeof valuesFromProperty>,
  "propertyGroupId" | "inForm" | "showOutsideAdvanced" | "showInListings" | "editableOnCard"
>;

/**
 * Watches the Display section's form values and saves whichever one changed, on change. Each control
 * is a select/checkbox so change is the right moment; the no-op + invalid guards live in `saveField`.
 */
function DisplayAutoSaver({
  values,
  save,
}: {
  values: DisplayWatched;
  save: ReturnType<typeof useFieldAutoSave<UpdateCustomPropertyInput, CustomProperty>>["saveField"];
}) {
  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      return;
    }
    save("propertyGroupId", values.propertyGroupId || null);
    save("hiddenFromForm", !values.inForm);
    save("showInForm", values.showOutsideAdvanced);
    save("showInListings", values.showInListings);
    save("editableOnCard", values.editableOnCard);
    // The per-field no-op guard means only the changed key actually persists.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);
  return null;
}

interface PropertyDisplayEditFormProps {
  property: CustomProperty;
  propertyGroups: PropertyGroup[];
}

/** The Display edit tab: reuses the shared section; each field auto-saves on change (no Save button). */
export function PropertyDisplayEditForm({
  property,
  propertyGroups,
}: PropertyDisplayEditFormProps) {
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const updateProperty = useUpdateCustomProperty();
  const {
    saveField,
  } = useFieldAutoSave<UpdateCustomPropertyInput, CustomProperty>({
    id: property.id,
    update: updateProperty,
    labels: LABELS,
    initial: {
      propertyGroupId: property.propertyGroupId,
      hiddenFromForm: property.hiddenFromForm,
      showInForm: property.showInForm,
      showInListings: property.showInListings,
      editableOnCard: property.editableOnCard,
    },
  });

  const groupOptions = [...propertyGroups]
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
    .map(group => ({
      value: group.id,
      label: group.name,
    }));

  const form: PropertyFormApi = useAppForm({
    defaultValues: valuesFromProperty(property),
    validators: {
      onChange: propertySchema,
    },
  });

  return (
    <>
      <PropertyDisplaySection
        form={form}
        idPrefix={`property-${property.id}`}
        groupOptions={groupOptions}
        addGroupOpen={addGroupOpen}
        setAddGroupOpen={setAddGroupOpen}
      />
      <form.Subscribe
        selector={state => ({
          propertyGroupId: state.values.propertyGroupId,
          inForm: state.values.inForm,
          showOutsideAdvanced: state.values.showOutsideAdvanced,
          showInListings: state.values.showInListings,
          editableOnCard: state.values.editableOnCard,
        })}
      >
        {values => (
          <DisplayAutoSaver
            values={values}
            save={saveField}
          />
        )}
      </form.Subscribe>
    </>
  );
}
