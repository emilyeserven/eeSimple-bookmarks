import type { SidebarCustomizationSettings, UpdateSidebarCustomizationInput } from "@eesimple/types";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { appSettingsApi } from "../../lib/api/settings";

const SIDEBAR_CUSTOMIZATION_KEY = ["app-settings", "sidebar-customization"] as const;

/** Defaults that mirror the former `useUiStore` initial state, used while the query is loading. */
const SIDEBAR_CUSTOMIZATION_DEFAULTS: SidebarCustomizationSettings = {
  hiddenTaxonomyItems: [],
  seeMoreTaxonomyItems: [],
  hiddenCustomizationItems: [],
  seeMoreCustomizationItems: [],
  hiddenManagementItems: [],
  hiddenSidebarGroups: [],
  hiddenConnectorLinks: [],
  seeMoreConnectorLinks: [],
};

/** Sidebar-customization settings (group A): which left-sidebar items/groups are hidden. */
export function useSidebarCustomizationSettings() {
  return useQuery({
    queryKey: SIDEBAR_CUSTOMIZATION_KEY,
    queryFn: appSettingsApi.getSidebarCustomization,
  });
}

export function useUpdateSidebarCustomizationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSidebarCustomizationInput) =>
      appSettingsApi.updateSidebarCustomization(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(SIDEBAR_CUSTOMIZATION_KEY, saved);
    },
  });
}

/** The resolved sidebar-customization object, falling back to the empty defaults while loading. */
export function useSidebarVisibility(): SidebarCustomizationSettings {
  const {
    data,
  } = useSidebarCustomizationSettings();
  return data ?? SIDEBAR_CUSTOMIZATION_DEFAULTS;
}
