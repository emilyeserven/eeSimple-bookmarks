import type { PropertyFormSection } from "./propertyFormSchema";
import type { CustomProperty } from "@eesimple/types";

import { PropertyDisplayEditForm } from "./PropertyDisplayEditForm";
import { PropertyGeneralEditForm } from "./PropertyGeneralEditForm";
import { PropertyOptionsEditForm } from "./PropertyOptionsEditForm";
import { PropertyCategoriesEditForm, PropertyMediaTypesEditForm } from "./PropertyScopeEditForms";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { usePropertyGroups } from "../hooks/usePropertyGroups";

interface PropertyEditFormProps {
  property: CustomProperty;
  /** Which tab (section) of the property edit pages to render. */
  section: PropertyFormSection;
}

/**
 * One custom-property edit tab. Each tab is an **independent auto-saving form** (no Save button): it
 * owns its own `useAppForm` seeded from the loaded property and persists fields on blur/change via the
 * edit-tab auto-save standard. This component just loads the taxonomy lists each tab needs and
 * dispatches to the right per-tab form.
 */
export function PropertyEditForm({
  property, section,
}: PropertyEditFormProps) {
  const {
    data: categories,
  } = useCategories();
  const {
    data: mediaTypes,
  } = useMediaTypes();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: propertyGroups,
  } = usePropertyGroups();

  // A calculate property may sum any other number property, but never itself.
  const numberProperties = (properties ?? []).filter(
    candidate => candidate.type === "number" && candidate.id !== property.id,
  );

  switch (section) {
    case "general":
      return <PropertyGeneralEditForm property={property} />;
    case "options":
      return (
        <PropertyOptionsEditForm
          property={property}
          numberProperties={numberProperties}
        />
      );
    case "categories":
      return (
        <PropertyCategoriesEditForm
          property={property}
          categories={categories ?? []}
        />
      );
    case "media-types":
      return (
        <PropertyMediaTypesEditForm
          property={property}
          mediaTypes={mediaTypes ?? []}
        />
      );
    case "display":
      return (
        <PropertyDisplayEditForm
          property={property}
          propertyGroups={propertyGroups ?? []}
        />
      );
  }
}
