import type { PropertyFormApi } from "./propertyFormSchema";
import type { Category, CustomProperty, MediaType, UpdateCustomPropertyInput } from "@eesimple/types";

import { useEffect, useRef } from "react";

import { propertySchema, valuesFromProperty } from "./propertyFormParts";
import { PropertyCategoriesSection, PropertyMediaTypesSection } from "./PropertyScopeSections";
import { useCollectionAutoSave } from "../hooks/useCollectionAutoSave";
import { useUpdateCustomProperty } from "../hooks/useCustomProperties";
import { useAppForm } from "../lib/form";

/**
 * Watches a coupled pair of form values and persists them together (one request, one toast) whenever
 * they settle to a new value. Rendered inside a `form.Subscribe` so it re-runs as the section mutates
 * the form. Kept as its own component so the effect has a single, stable dependency set.
 */
function ScopeAutoSaver({
  values,
  save,
}: {
  values: Partial<UpdateCustomPropertyInput>;
  save: (input: Partial<UpdateCustomPropertyInput>) => void;
}) {
  // Skip the seed render: only persist values the user actually changed.
  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      return;
    }
    save(values);
    // The no-op guard lives in `saveNow`; re-run whenever the watched values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);
  return null;
}

/** The shared collection engine bound to one property's update mutation (one request, one toast). */
function useScopeSectionSave(
  property: CustomProperty,
  label: string,
  initial: Partial<UpdateCustomPropertyInput>,
) {
  const updateProperty = useUpdateCustomProperty();
  const {
    saveNow,
  } = useCollectionAutoSave<Partial<UpdateCustomPropertyInput>>({
    id: property.id,
    label,
    persist: (input, callbacks) => updateProperty.mutate({
      id: property.id,
      input,
    }, callbacks),
    initial,
  });
  return saveNow;
}

/** The Categories edit tab: reuses the shared section; persists `{ allCategories, categoryIds }`. */
export function PropertyCategoriesEditForm({
  property,
  categories,
}: {
  property: CustomProperty;
  categories: Category[];
}) {
  const saveNow = useScopeSectionSave(property, "Categories", {
    allCategories: property.allCategories,
    categoryIds: property.categoryIds,
  });

  const form = useScopeForm(property);

  return (
    <>
      <PropertyCategoriesSection
        form={form}
        categories={categories}
        idPrefix={`property-${property.id}-category`}
        mode="edit"
        section="categories"
      />
      <form.Subscribe
        selector={state => ({
          allCategories: state.values.allCategories,
          categoryIds: state.values.categoryIds,
        })}
      >
        {values => (
          <ScopeAutoSaver
            values={values}
            save={saveNow}
          />
        )}
      </form.Subscribe>
    </>
  );
}

/** The Media Types edit tab: reuses the shared section; persists `{ allMediaTypes, mediaTypeIds }`. */
export function PropertyMediaTypesEditForm({
  property,
  mediaTypes,
}: {
  property: CustomProperty;
  mediaTypes: MediaType[];
}) {
  const saveNow = useScopeSectionSave(property, "Media Types", {
    allMediaTypes: property.allMediaTypes,
    mediaTypeIds: property.mediaTypeIds,
  });

  const form = useScopeForm(property);

  return (
    <>
      <PropertyMediaTypesSection
        form={form}
        mediaTypes={mediaTypes}
        idPrefix={`property-${property.id}-category`}
        section="media-types"
      />
      <form.Subscribe
        selector={state => ({
          allMediaTypes: state.values.allMediaTypes,
          mediaTypeIds: state.values.mediaTypeIds,
        })}
      >
        {values => (
          <ScopeAutoSaver
            values={values}
            save={saveNow}
          />
        )}
      </form.Subscribe>
    </>
  );
}

/** A property form seeded from the loaded property, shared by the two scope edit tabs. */
function useScopeForm(property: CustomProperty): PropertyFormApi {
  return useAppForm({
    defaultValues: valuesFromProperty(property),
    validators: {
      onChange: propertySchema,
    },
  });
}
