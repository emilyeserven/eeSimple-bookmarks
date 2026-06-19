import type { PropertyFormSection } from "./PropertyForm";
import type { CustomProperty } from "@eesimple/types";

import { useNavigate } from "@tanstack/react-router";

import { PropertyForm } from "./PropertyForm";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties, useUpdateCustomProperty } from "../hooks/useCustomProperties";
import { useMediaTypes } from "../hooks/useMediaTypes";
import { usePropertyGroups } from "../hooks/usePropertyGroups";

interface PropertyEditFormProps {
  property: CustomProperty;
  /** Which section (tab) of the shared form to render. */
  section: PropertyFormSection;
}

/**
 * One custom-property edit tab. Renders a single `section` of the shared `PropertyForm` and saves the
 * whole (prefilled) property on submit — so each tab reuses the canonical form rather than
 * re-implementing its fields.
 */
export function PropertyEditForm({
  property, section,
}: PropertyEditFormProps) {
  const navigate = useNavigate();
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
  const updateProperty = useUpdateCustomProperty();

  // A calculate property may sum any other number property, but never itself.
  const numberProperties = (properties ?? []).filter(
    candidate => candidate.type === "number" && candidate.id !== property.id,
  );

  return (
    <PropertyForm
      mode="edit"
      section={section}
      property={property}
      categories={categories ?? []}
      mediaTypes={mediaTypes ?? []}
      numberProperties={numberProperties}
      propertyGroups={propertyGroups ?? []}
      onSubmit={({
        type, ...input
      }) => updateProperty.mutate({
        id: property.id,
        input,
      }, {
        // Renaming (only possible on the General tab) can change the slug, so follow it.
        onSuccess: (updated) => {
          if (updated.slug !== property.slug) {
            void navigate({
              to: "/custom-properties/$propertySlug/edit/general",
              params: {
                propertySlug: updated.slug,
              },
            });
          }
        },
      })}
      submitLabel="Save changes"
      pendingLabel="Saving…"
      errorMessage={updateProperty.isError ? updateProperty.error.message : undefined}
      idPrefix={`property-${property.id}-category`}
    />
  );
}
