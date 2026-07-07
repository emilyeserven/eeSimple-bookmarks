import type { EntityWorkbench } from "./types";
import type { LocationNode } from "@eesimple/types";

import i18n from "../../i18n";
import { AutofillRulesList } from "../AutofillRulesList";
import { CardDisplayRulesList } from "../CardDisplayRulesList";
import { LocationGeneralForm } from "../LocationGeneralForm";
import { LocationGeneralView, LocationHierarchyView } from "./locationViews";

import { useDeleteLocation, useLocationById, useLocationBySlug } from "@/hooks/useLocations";

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
  tabs: [
    {
      key: "general",
      label: "General",
      view: {
        title: i18n.t("General"),
        description: i18n.t("Name, coordinates, and location details."),
        render: LocationGeneralView,
      },
      edit: {
        title: i18n.t("General"),
        description: i18n.t("Name, coordinates, parent, alternate names, and tags."),
        render: ({
          entity,
        }) => <LocationGeneralForm node={entity} />,
      },
    },
    {
      key: "hierarchy",
      label: "Hierarchy",
      view: {
        title: i18n.t("Hierarchy"),
        description: i18n.t("Parent and child locations."),
        render: LocationHierarchyView,
      },
    },
    {
      key: "autofill",
      label: "Autofill Rules",
      group: i18n.t("Rules"),
      view: {
        title: i18n.t("Autofill Rules"),
        description: i18n.t("Autofill rules that apply this location."),
        render: ({
          entity,
        }) => (
          <AutofillRulesList
            locationId={entity.id}
            query=""
          />
        ),
      },
      edit: {
        title: i18n.t("Autofill Rules"),
        description: i18n.t("Autofill rules that apply this location."),
        render: ({
          entity,
        }) => (
          <AutofillRulesList
            locationId={entity.id}
            query=""
          />
        ),
      },
    },
    {
      key: "display-rules",
      label: "Display Rules",
      group: i18n.t("Rules"),
      view: {
        title: i18n.t("Display Rules"),
        description: i18n.t("Card display rules whose conditions reference this location."),
        render: ({
          entity,
        }) => <CardDisplayRulesList locationId={entity.id} />,
      },
      edit: {
        title: i18n.t("Display Rules"),
        description: i18n.t("Card display rules whose conditions reference this location."),
        render: ({
          entity,
        }) => <CardDisplayRulesList locationId={entity.id} />,
      },
    },
  ],
};
