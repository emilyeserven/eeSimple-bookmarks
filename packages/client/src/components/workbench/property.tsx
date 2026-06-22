/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench } from "./types";
import type { PropertyFormSection } from "../propertyFormSchema";
import type { CustomProperty } from "@eesimple/types";

import {
  PropertyCategoriesContent,
  PropertyDisplayFields,
  PropertyGeneralFields,
  PropertyMediaTypesContent,
  PropertyOptionsFields,
} from "../PropertyDetail";
import { PropertyEditForm } from "../PropertyEditForm";

import { useCategories } from "@/hooks/useCategories";
import { useCustomProperties, useDeleteCustomProperty, usePropertyBySlug } from "@/hooks/useCustomProperties";
import { useMediaTypes } from "@/hooks/useMediaTypes";
import { usePropertyGroups } from "@/hooks/usePropertyGroups";
import { hasPropertyOptions } from "@/lib/propertyForm";

function PropertyOptionsView({
  entity: property,
}: {
  entity: CustomProperty;
}) {
  const {
    data: properties,
  } = useCustomProperties();
  return (
    <PropertyOptionsFields
      property={property}
      allProperties={properties ?? []}
    />
  );
}

function PropertyCategoriesView({
  entity: property,
}: {
  entity: CustomProperty;
}) {
  const {
    data: categories,
  } = useCategories();
  return (
    <PropertyCategoriesContent
      property={property}
      categories={categories ?? []}
    />
  );
}

function PropertyMediaTypesView({
  entity: property,
}: {
  entity: CustomProperty;
}) {
  const {
    data: mediaTypes,
  } = useMediaTypes();
  return (
    <PropertyMediaTypesContent
      property={property}
      mediaTypes={mediaTypes ?? []}
    />
  );
}

function PropertyDisplayView({
  entity: property,
}: {
  entity: CustomProperty;
}) {
  const {
    data: propertyGroups,
  } = usePropertyGroups();
  return (
    <PropertyDisplayFields
      property={property}
      propertyGroups={propertyGroups ?? []}
    />
  );
}

function editPane(section: PropertyFormSection) {
  function PropertyEditPane({
    entity,
  }: {
    entity: CustomProperty;
  }) {
    return (
      <PropertyEditForm
        property={entity}
        section={section}
      />
    );
  }
  return PropertyEditPane;
}

/** Single source of truth for a custom property's tabbed view/edit UI (main pane routes + right panel). */
export const propertyWorkbench: EntityWorkbench<CustomProperty> = {
  useBySlug: (slug) => {
    const {
      property, isLoading,
    } = usePropertyBySlug(slug);
    return {
      entity: property,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      data, isLoading, error,
    } = useCustomProperties();
    return {
      entity: (data ?? []).find(item => item.id === id),
      isLoading,
      error,
    };
  },
  name: property => property.name,
  useDelete: () => {
    const mutation = useDeleteCustomProperty();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: "Custom property not found.",
  navAriaLabel: "Custom property sections",
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: "General",
        description: "Status, description, and when this property was created.",
        render: ({
          entity,
        }) => <PropertyGeneralFields property={entity} />,
      },
      edit: {
        title: "General",
        description: "Name, status, and description.",
        render: editPane("general"),
      },
    },
    {
      key: "options",
      label: "Options",
      showIf: hasPropertyOptions,
      view: {
        title: "Options",
        description: "Type-specific configuration for this property.",
        render: PropertyOptionsView,
      },
      edit: {
        title: "Options",
        description: "Type-specific configuration for this property.",
        render: editPane("options"),
      },
    },
    {
      key: "categories",
      label: "Categories",
      view: {
        title: "Categories",
        description: "The categories this property applies to.",
        render: PropertyCategoriesView,
      },
      edit: {
        title: "Categories",
        description: "Choose which categories this property applies to.",
        render: editPane("categories"),
      },
    },
    {
      key: "media-types",
      label: "Media Types",
      view: {
        title: "Media Types",
        description: "The media types this property is also scoped to.",
        render: PropertyMediaTypesView,
      },
      edit: {
        title: "Media Types",
        description: "Also show this property on bookmarks of the chosen media types (in addition to its categories).",
        render: editPane("media-types"),
      },
    },
    {
      key: "display",
      label: "Display",
      view: {
        title: "Display",
        description: "Where this property appears and whether it's editable from the card menu.",
        render: PropertyDisplayView,
      },
      edit: {
        title: "Display",
        description: "Where this property appears and whether it's editable from the card menu.",
        render: editPane("display"),
      },
    },
  ],
};
