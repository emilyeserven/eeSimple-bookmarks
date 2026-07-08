import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout, LocationNode } from "@eesimple/types";

import i18n from "../../i18n";
import { AutofillRulesList } from "../AutofillRulesList";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import { LocationGeneralForm } from "../LocationGeneralForm";
import { LocationGeneralView, LocationHierarchyView } from "./locationViews";

import { useDeleteLocation, useLocationById, useLocationBySlug } from "@/hooks/useLocations";

/**
 * The location workbench's field registry (#1106 layout editor). Each existing tab pane becomes ONE
 * placeable, mode-aware {@link WorkbenchField} keyed by the tab's own key (#1165 composite-editor
 * recipe) — `general` bundles the existing view/edit composites (including the location map)
 * unchanged, and `hierarchy` is **view-only** (no `edit`), which is what makes the Hierarchy tab
 * disappear in edit mode for free. Authored as an exhaustive `Record<LocationFieldKey, …>` so a key
 * without a renderer fails `tsc`.
 */
type LocationFieldKey
  = | "general"
    | "hierarchy"
    | "autofillRules"
    | "displayRules";

const locationFields = {
  general: {
    key: "general",
    label: i18n.t("General"),
    view: LocationGeneralView,
    edit: ({
      entity,
    }) => <LocationGeneralForm node={entity} />,
  },
  hierarchy: {
    key: "hierarchy",
    label: i18n.t("Hierarchy"),
    view: LocationHierarchyView,
  },
  autofillRules: {
    key: "autofillRules",
    label: i18n.t("Autofill Rules"),
    view: ({
      entity,
    }) => (
      <AutofillRulesList
        locationId={entity.id}
        query=""
      />
    ),
    edit: ({
      entity,
    }) => (
      <AutofillRulesList
        locationId={entity.id}
        query=""
      />
    ),
  },
  displayRules: {
    key: "displayRules",
    label: i18n.t("Display Rules"),
    view: ({
      entity,
    }) => <CardDisplayRulesList locationId={entity.id} />,
    edit: ({
      entity,
    }) => <CardDisplayRulesList locationId={entity.id} />,
  },
} satisfies Record<LocationFieldKey, WorkbenchField<LocationNode>>;

/** The code-defined default layout — the current tab list, one untitled section per tab. */
const LOCATION_DEFAULT_LAYOUT: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
      sections: [{
        key: "general",
        fields: ["general"] satisfies LocationFieldKey[],
      }],
    },
    {
      key: "hierarchy",
      label: i18n.t("Hierarchy"),
      sections: [{
        key: "hierarchy",
        fields: ["hierarchy"] satisfies LocationFieldKey[],
      }],
    },
    {
      key: "autofill",
      label: i18n.t("Autofill Rules"),
      sections: [{
        key: "autofill",
        fields: ["autofillRules"] satisfies LocationFieldKey[],
      }],
    },
    {
      key: "display-rules",
      label: i18n.t("Display Rules"),
      sections: [{
        key: "display-rules",
        fields: ["displayRules"] satisfies LocationFieldKey[],
      }],
    },
  ],
};

/** Single source of truth for a location's tabbed view/edit UI (main pane routes + right panel). */
export const locationWorkbench: EntityWorkbench<LocationNode> = {
  useBySlug: (slug) => {
    const {
      location, isLoading,
    } = useLocationBySlug(slug);
    return {
      entity: location,
      isLoading,
    };
  },
  useById: (id) => {
    const {
      location, isLoading, error,
    } = useLocationById(id);
    return {
      entity: location,
      isLoading,
      error,
    };
  },
  name: node => node.name,
  isBuiltIn: () => false,
  canDelete: () => true,
  useDelete: () => {
    const mutation = useDeleteLocation();
    return {
      isPending: mutation.isPending,
      error: mutation.isError ? mutation.error.message : null,
      run: (id, onDeleted) => mutation.mutate(id, {
        onSuccess: onDeleted,
      }),
    };
  },
  notFound: i18n.t("Location not found."),
  navAriaLabel: i18n.t("Location sections"),
  listingPath: "/taxonomies/locations",
  getSlug: location => location.slug,
  layoutKind: "location",
  fields: locationFields,
  defaultLayout: LOCATION_DEFAULT_LAYOUT,
  // Layout-driven: the tab rail + section stacks come from `fields` + `defaultLayout`. `tabs` is
  // retained only to carry the code-only `group` nav metadata (the "Rules" More dropdown on the
  // edit strip), re-attached by tab key in `deriveWorkbenchTabs`.
  tabs: [
    {
      key: "general",
      label: i18n.t("General"),
    },
    {
      key: "hierarchy",
      label: i18n.t("Hierarchy"),
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
