/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { SlidersHorizontal } from "lucide-react";

import { Loading, Problem } from "./status";
import { useCategories } from "../../../hooks/useCategories";
import {
  useCustomProperties,
  useDeleteCustomProperty,
  useUpdateCustomProperty,
} from "../../../hooks/useCustomProperties";
import { usePropertyGroups } from "../../../hooks/usePropertyGroups";
import { PropertyDetail } from "../../PropertyDetail";
import { PropertyForm } from "../../PropertyForm";
import { usePanelControls } from "../usePanelControls";
import { usePanelDismissAfterDelete } from "../usePanelDismissAfterDelete";

function usePropertyList() {
  const {
    data, isLoading, error,
  } = useCustomProperties();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(property => ({
      id: property.id,
      label: property.name,
      sublabel: property.type,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only property, reusing the same `PropertyDetail` the full detail page renders. */
function PropertyView({
  id,
}: {
  id: string;
}) {
  const {
    data: properties, isLoading, error,
  } = useCustomProperties();
  const {
    data: propertyGroups,
  } = usePropertyGroups();
  const {
    data: categories,
  } = useCategories();
  const {
    openItem,
  } = usePanelControls();
  const dismiss = usePanelDismissAfterDelete();
  const deleteProperty = useDeleteCustomProperty();

  if (isLoading) return <Loading />;
  if (error) return <Problem>{error.message}</Problem>;
  const property = (properties ?? []).find(item => item.id === id);
  if (!property) return <Problem>Property not found.</Problem>;

  return (
    <PropertyDetail
      property={property}
      categories={categories ?? []}
      allProperties={properties ?? []}
      propertyGroups={propertyGroups ?? []}
      onEdit={() => openItem("property", id, "edit")}
      onDelete={() => deleteProperty.mutate(id, {
        onSuccess: dismiss,
      })}
    />
  );
}

/** Edit a property with the same `PropertyForm` the main app uses. */
function PropertyEdit({
  id,
}: {
  id: string;
}) {
  const {
    data: properties, isLoading, error,
  } = useCustomProperties();
  const {
    data: propertyGroups,
  } = usePropertyGroups();
  const {
    data: categories,
  } = useCategories();
  const {
    openItem,
  } = usePanelControls();
  const updateProperty = useUpdateCustomProperty();

  if (isLoading) return <Loading />;
  if (error) return <Problem>{error.message}</Problem>;
  const property = (properties ?? []).find(item => item.id === id);
  if (!property) return <Problem>Property not found.</Problem>;

  // A calculate property may sum any other number property, but never itself.
  const numberProperties = (properties ?? []).filter(
    candidate => candidate.type === "number" && candidate.id !== property.id,
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Edit custom property</h2>
      <PropertyForm
        mode="edit"
        property={property}
        categories={categories ?? []}
        numberProperties={numberProperties}
        propertyGroups={propertyGroups ?? []}
        onSubmit={({
          type, ...input
        }) => updateProperty.mutate({
          id,
          input,
        }, {
          onSuccess: () => openItem("property", id, "view"),
        })}
        submitLabel="Save changes"
        pendingLabel="Saving…"
        errorMessage={updateProperty.isError ? updateProperty.error.message : undefined}
        idPrefix={`panel-property-${id}-category`}
      />
    </div>
  );
}

export const propertyContentType: PanelContentTypeDef = {
  type: "property",
  label: "Custom Properties",
  singular: "Custom Property",
  icon: SlidersHorizontal,
  useList: usePropertyList,
  View: PropertyView,
  Edit: PropertyEdit,
};
