/* eslint-disable react-refresh/only-export-components -- this module exports an entity descriptor that pairs tab bodies with metadata, not a component */
import type { EntityWorkbench, WorkbenchField } from "./types";
import type { PropertyFormSection } from "../propertyFormSchema";
import type { CustomProperty, EntityLayout } from "@eesimple/types";

import i18n from "../../i18n";
import { AutofillRulesList } from "../AutofillRulesList";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import {
  PropertyCategoriesContent,
  PropertyCreatedView,
  PropertyDescriptionView,
  PropertyDisplayFields,
  PropertyMediaTypesContent,
  PropertyOptionsFields,
  PropertyStatusView,
} from "../PropertyDetail";
import { PropertyEditForm } from "../PropertyEditForm";
import {
  PropertyDescriptionField,
  PropertyNameField,
  PropertyStatusField,
  PropertyTypeField,
} from "../PropertyGeneralEditForm";

import { useCategories } from "@/hooks/useCategories";
import { useCustomProperties, useDeleteCustomProperty, usePropertyBySlug } from "@/hooks/useCustomProperties";
import { useMediaTypes } from "@/hooks/useMediaTypes";
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
  return <PropertyDisplayFields property={property} />;
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

/**
 * The custom-property workbench's field registry (#1106 layout editor). Most tab panes are ONE
 * placeable, mode-aware {@link WorkbenchField} keyed by the tab's own key (#1165 composite-editor
 * recipe); the former `general` composite is atomized (#1196) into `name`/`type`/`status`/
 * `description`/`created` so each row is independently placeable in Page Layouts. View/edit parity is
 * by construction: `name`/`type` are edit-only, `created` is view-only, `status`/`description` carry
 * both. Ordered so the default layout renders byte-identically in both modes — edit-visible fields are
 * `name → type → status → description` (the old edit order), view-visible are `status → description →
 * created` (the old view order). The former tab-level `showIf: hasPropertyOptions` moves onto the
 * `options` field itself — `fieldRendersInMode` checks `showIf` before a field counts as visible, so
 * an options-less property's Options section (and therefore its tab) still hides exactly as before.
 * Authored as an exhaustive `Record<PropertyFieldKey, …>` so a key without a renderer fails `tsc`.
 */
type PropertyFieldKey
  = | "name"
    | "type"
    | "status"
    | "description"
    | "created"
    | "options"
    | "categories"
    | "mediaTypes"
    | "display"
    | "autofillRules"
    | "displayRules";

const propertyFields = {
  name: {
    key: "name",
    label: i18n.t("Name"),
    edit: ({
      entity,
    }) => <PropertyNameField property={entity} />,
  },
  type: {
    key: "type",
    label: i18n.t("Type"),
    edit: ({
      entity,
    }) => <PropertyTypeField property={entity} />,
  },
  status: {
    key: "status",
    label: i18n.t("Status"),
    view: ({
      entity,
    }) => <PropertyStatusView property={entity} />,
    edit: ({
      entity,
    }) => <PropertyStatusField property={entity} />,
  },
  description: {
    key: "description",
    label: i18n.t("Description"),
    view: ({
      entity,
    }) => <PropertyDescriptionView property={entity} />,
    edit: ({
      entity,
    }) => <PropertyDescriptionField property={entity} />,
  },
  created: {
    key: "created",
    label: i18n.t("Created"),
    view: ({
      entity,
    }) => <PropertyCreatedView property={entity} />,
  },
  options: {
    key: "options",
    label: i18n.t("Options"),
    showIf: hasPropertyOptions,
    view: PropertyOptionsView,
    edit: editPane("options"),
  },
  categories: {
    key: "categories",
    label: i18n.t("Categories"),
    view: PropertyCategoriesView,
    edit: editPane("categories"),
  },
  mediaTypes: {
    key: "mediaTypes",
    label: i18n.t("Media Types"),
    view: PropertyMediaTypesView,
    edit: editPane("media-types"),
  },
  display: {
    key: "display",
    label: i18n.t("Display"),
    view: PropertyDisplayView,
    edit: editPane("display"),
  },
  autofillRules: {
    key: "autofillRules",
    label: i18n.t("Autofill Rules"),
    view: ({
      entity,
    }) => (
      <AutofillRulesList
        propertyId={entity.id}
        query=""
      />
    ),
    edit: ({
      entity,
    }) => (
      <AutofillRulesList
        propertyId={entity.id}
        query=""
      />
    ),
  },
  displayRules: {
    key: "displayRules",
    label: i18n.t("Display Rules"),
    view: ({
      entity,
    }) => <CardDisplayRulesList propertyId={entity.id} />,
    edit: ({
      entity,
    }) => <CardDisplayRulesList propertyId={entity.id} />,
  },
} satisfies Record<PropertyFieldKey, WorkbenchField<CustomProperty>>;

/** The code-defined default layout — the current tab list, one untitled section per tab. */
const PROPERTY_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["name", "type", "status", "description", "created"] satisfies PropertyFieldKey[],
      }],
    },
    {
      key: "options",
      label: i18n.t("Options"),
      sections: [{
        key: "options",
        fields: ["options"] satisfies PropertyFieldKey[],
      }],
    },
    {
      key: "categories",
      label: i18n.t("Categories"),
      sections: [{
        key: "categories",
        fields: ["categories"] satisfies PropertyFieldKey[],
      }],
    },
    {
      key: "media-types",
      label: i18n.t("Media Types"),
      sections: [{
        key: "media-types",
        fields: ["mediaTypes"] satisfies PropertyFieldKey[],
      }],
    },
    {
      key: "display",
      label: i18n.t("Display"),
      sections: [{
        key: "display",
        fields: ["display"] satisfies PropertyFieldKey[],
      }],
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
      sections: [{
        key: "autofill",
        fields: ["autofillRules"] satisfies PropertyFieldKey[],
      }],
    },
    {
      key: "display-rules",
      label: i18n.t("Display Rules"),
      sections: [{
        key: "display-rules",
        fields: ["displayRules"] satisfies PropertyFieldKey[],
      }],
    },
  ],
};

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
  notFound: i18n.t("Custom property not found."),
  navAriaLabel: i18n.t("Custom property sections"),
  getSlug: property => property.slug,
  layoutKind: "custom-property",
  fields: propertyFields,
  defaultLayout: PROPERTY_DEFAULT_LAYOUT,
  // Layout-driven: the tab rail + section stacks come from `fields` + `defaultLayout`. `tabs` is
  // retained only to carry the code-only `group` nav metadata (the "Rules" More dropdown on the
  // edit strip), re-attached by tab key in `deriveWorkbenchTabs`.
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
    {
      key: "options",
      label: i18n.t("Options"),
    },
    {
      key: "categories",
      label: i18n.t("Categories"),
    },
    {
      key: "media-types",
      label: i18n.t("Media Types"),
    },
    {
      key: "display",
      label: i18n.t("Display"),
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
      group: i18n.t("Rules"),
    },
    {
      key: "display-rules",
      label: i18n.t("Display Rules"),
      group: i18n.t("Rules"),
    },
  ],
};
