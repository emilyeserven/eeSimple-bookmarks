import type { SidebarCustomizationSettings } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import {
  useSidebarVisibility,
  useUpdateSidebarCustomizationSettings,
} from "./useAppSettings";
import { notifyError, notifySuccess } from "../lib/notifications";

type CategoryDisplayMode = "visible" | "see-more" | "hidden";

/**
 * Owns the sidebar-visibility settings state and every persist handler for
 * `DisplaySidebarSettings` — each mutation fires the shared "Sidebar updated" toast. Pulled out of
 * the component so the view file carries only its presentational imports.
 */
export function useSidebarSettings() {
  const sidebar = useSidebarVisibility();
  const updateSidebar = useUpdateSidebarCustomizationSettings();
  const {
    t,
  } = useTranslation();

  /** Toggle a value in one of the sidebar hidden-lists, persist the whole group, and toast. */
  function toggleSidebarKey(key: keyof SidebarCustomizationSettings, value: string): void {
    const current = sidebar[key];
    const next = current.includes(value)
      ? current.filter(x => x !== value)
      : [...current, value];
    updateSidebar.mutate({
      ...sidebar,
      [key]: next,
    }, {
      onSuccess: () => notifySuccess(t("Sidebar updated")),
      onError: error => notifyError(error.message),
    });
  }

  function setTaxonomyItemMode(key: string, mode: CategoryDisplayMode): void {
    updateSidebar.mutate({
      ...sidebar,
      hiddenTaxonomyItems: mode === "hidden"
        ? [...sidebar.hiddenTaxonomyItems.filter(x => x !== key), key]
        : sidebar.hiddenTaxonomyItems.filter(x => x !== key),
      seeMoreTaxonomyItems: mode === "see-more"
        ? [...sidebar.seeMoreTaxonomyItems.filter(x => x !== key), key]
        : sidebar.seeMoreTaxonomyItems.filter(x => x !== key),
    }, {
      onSuccess: () => notifySuccess(t("Sidebar updated")),
      onError: error => notifyError(error.message),
    });
  }

  function setCustomizationItemMode(key: string, mode: CategoryDisplayMode): void {
    updateSidebar.mutate({
      ...sidebar,
      hiddenCustomizationItems: mode === "hidden"
        ? [...sidebar.hiddenCustomizationItems.filter(x => x !== key), key]
        : sidebar.hiddenCustomizationItems.filter(x => x !== key),
      seeMoreCustomizationItems: mode === "see-more"
        ? [...sidebar.seeMoreCustomizationItems.filter(x => x !== key), key]
        : sidebar.seeMoreCustomizationItems.filter(x => x !== key),
    }, {
      onSuccess: () => notifySuccess(t("Sidebar updated")),
      onError: error => notifyError(error.message),
    });
  }

  function setConnectorLinkMode(key: string, mode: CategoryDisplayMode): void {
    updateSidebar.mutate({
      ...sidebar,
      hiddenConnectorLinks: mode === "hidden"
        ? [...sidebar.hiddenConnectorLinks.filter(x => x !== key), key]
        : sidebar.hiddenConnectorLinks.filter(x => x !== key),
      seeMoreConnectorLinks: mode === "see-more"
        ? [...sidebar.seeMoreConnectorLinks.filter(x => x !== key), key]
        : sidebar.seeMoreConnectorLinks.filter(x => x !== key),
    }, {
      onSuccess: () => notifySuccess(t("Sidebar updated")),
      onError: error => notifyError(error.message),
    });
  }

  const toggleSidebarGroup = (group: string) => toggleSidebarKey("hiddenSidebarGroups", group);

  return {
    sidebar,
    setTaxonomyItemMode,
    setCustomizationItemMode,
    setConnectorLinkMode,
    toggleSidebarGroup,
  };
}
