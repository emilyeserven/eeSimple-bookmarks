/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";
import type { PropertyFormSection } from "../../propertyFormSchema";

import { Fragment, useMemo } from "react";

import { SlidersHorizontal } from "lucide-react";

import { WithPanelItem } from "./status";
import { useCategories } from "../../../hooks/useCategories";
import {
  useCustomProperties,
  useDeleteCustomProperty,
} from "../../../hooks/useCustomProperties";
import { usePropertyGroups } from "../../../hooks/usePropertyGroups";
import { hasPropertyOptions } from "../../../lib/propertyForm";
import { LabeledSection } from "../../LabeledSection";
import { PropertyDetail } from "../../PropertyDetail";
import { PropertyEditForm } from "../../PropertyEditForm";
import { PanelEntityEditor } from "../PanelEntityEditor";
import { usePanelControls } from "../usePanelControls";
import { usePanelDismissAfterDelete } from "../usePanelDismissAfterDelete";

import { Separator } from "@/components/ui/separator";

/**
 * The property's field-edit sections, mirroring the edit tabs (the "Autofill Rules" tab is a
 * separate relationship list, not a field editor, so it's omitted). "Options" only applies to types
 * that have type-specific configuration.
 */
const PROPERTY_EDIT_SECTIONS: { section: PropertyFormSection;
  title: string;
  description: string; }[] = [
  {
    section: "general",
    title: "General",
    description: "Name, status, and description.",
  },
  {
    section: "options",
    title: "Options",
    description: "Type-specific configuration for this property.",
  },
  {
    section: "categories",
    title: "Categories",
    description: "Choose which categories this property applies to.",
  },
  {
    section: "media-types",
    title: "Media Types",
    description: "Also show this property on bookmarks of the chosen media types (in addition to its categories).",
  },
  {
    section: "display",
    title: "Display",
    description: "Where this property appears and whether it's editable from the card menu.",
  },
];

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
  const propertiesQuery = useCustomProperties();
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

  return (
    <WithPanelItem
      queryResult={propertiesQuery}
      id={id}
      notFoundMessage="Property not found."
    >
      {property => (
        <PropertyDetail
          property={property}
          categories={categories ?? []}
          allProperties={propertiesQuery.data ?? []}
          propertyGroups={propertyGroups ?? []}
          onEdit={() => openItem("property", id, "edit")}
          onDelete={() => deleteProperty.mutate(id, {
            onSuccess: dismiss,
          })}
        />
      )}
    </WithPanelItem>
  );
}

/**
 * Edit a property by reusing the **same** per-tab auto-save forms the main-app edit tabs render
 * (`PropertyEditForm`), stacked since the panel is a single column — not the monolithic submit
 * `PropertyForm` (that stays for create only).
 */
function PropertyEdit({
  id,
}: {
  id: string;
}) {
  const propertiesQuery = useCustomProperties();
  const deleteProperty = useDeleteCustomProperty();
  const dismiss = usePanelDismissAfterDelete();

  return (
    <WithPanelItem
      queryResult={propertiesQuery}
      id={id}
      notFoundMessage="Property not found."
    >
      {(property) => {
        const sections = PROPERTY_EDIT_SECTIONS.filter(
          entry => entry.section !== "options" || hasPropertyOptions(property),
        );
        return (
          <PanelEntityEditor
            name={property.name}
            onDelete={() => deleteProperty.mutate(id, {
              onSuccess: dismiss,
            })}
            deleteIsPending={deleteProperty.isPending}
            deleteError={deleteProperty.isError ? deleteProperty.error.message : null}
          >
            <div className="space-y-6">
              {sections.map((entry, index) => (
                <Fragment key={entry.section}>
                  {index > 0 ? <Separator /> : null}
                  <LabeledSection
                    title={entry.title}
                    description={entry.description}
                  >
                    <PropertyEditForm
                      property={property}
                      section={entry.section}
                    />
                  </LabeledSection>
                </Fragment>
              ))}
            </div>
          </PanelEntityEditor>
        );
      }}
    </WithPanelItem>
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
