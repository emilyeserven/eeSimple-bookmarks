import type { PropertyFormApi } from "./propertyFormSchema";
import type { Category, CustomProperty, MediaType, UpdateCustomPropertyInput } from "@eesimple/types";

import { useEffect, useRef } from "react";

import { useTranslation } from "react-i18next";

import { propertySchema, valuesFromProperty } from "./propertyFormParts";
import { PropertyCategoriesSection, PropertyMediaTypesSection } from "./PropertyScopeSections";
import { useUpdateCustomProperty } from "../hooks/useCustomProperties";
import { useSectionAutoSave } from "../hooks/useSectionAutoSave";
import { useAppForm } from "../lib/form";

/**
 * Watches a coupled pair of form values and persists them together (one request, one toast) whenever
 * they settle to a new value. Rendered inside a `form.Subscribe` so it re-runs as the section mutates
 * the form. Kept as its own component so the effect has a single, stable dependency set.
 */
function ScopeAutoSaver({
  values,
  label,
  save,
}: {
  values: Partial<UpdateCustomPropertyInput>;
  label: string;
  save: (input: Partial<UpdateCustomPropertyInput>, label: string) => void;
}) {
  // Skip the seed render: only persist values the user actually changed.
  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      return;
    }
    save(values, label);
    // The no-op guard lives in `saveSection`; re-run whenever the watched values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);
  return null;
}

/** The Categories edit tab: reuses the shared section; persists `{ allCategories, categoryIds }`. */
export function PropertyCategoriesEditForm({
  property,
  categories,
}: {
  property: CustomProperty;
  categories: Category[];
}) {
  const {
    t,
  } = useTranslation();
  const updateProperty = useUpdateCustomProperty();
  const {
    saveSection,
  } = useSectionAutoSave<UpdateCustomPropertyInput, CustomProperty>({
    id: property.id,
    update: updateProperty,
    initial: {
      allCategories: property.allCategories,
      categoryIds: property.categoryIds,
    },
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
            label={t("Categories")}
            save={saveSection}
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
  const {
    t,
  } = useTranslation();
  const updateProperty = useUpdateCustomProperty();
  const {
    saveSection,
  } = useSectionAutoSave<UpdateCustomPropertyInput, CustomProperty>({
    id: property.id,
    update: updateProperty,
    initial: {
      allMediaTypes: property.allMediaTypes,
      mediaTypeIds: property.mediaTypeIds,
    },
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
            label={t("Media Types")}
            save={saveSection}
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
