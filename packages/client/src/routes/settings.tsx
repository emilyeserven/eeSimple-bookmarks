import { createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useUiStore } from "../stores/uiStore";

export const Route = createFileRoute("/settings")({
  component: SettingsLayout,
});

const settingsNav = [
  {
    to: "/settings/custom-properties",
    label: "Custom Properties",
    customizationKey: "custom-properties",
  },
  {
    to: "/settings/autofill",
    label: "Autofill Rules",
    customizationKey: "autofill",
  },
  {
    to: "/settings/gallery",
    label: "Gallery",
  },
  {
    to: "/settings/display",
    label: "Display",
  },
  {
    to: "/settings/sidebar",
    label: "Drawer",
  },
  {
    to: "/settings/homepage",
    label: "Homepage",
  },
  {
    to: "/settings/websites",
    label: "Websites",
    taxonomyKey: "websites",
  },
  {
    to: "/settings/media-types",
    label: "Media Types",
    taxonomyKey: "media-types",
  },
  {
    to: "/settings/youtube-channels",
    label: "YouTube Channels",
    taxonomyKey: "youtube-channels",
  },
  {
    to: "/settings/automations",
    label: "Automations",
  },
  {
    to: "/settings/link-parsing",
    label: "Link parsing",
  },
] as const;

function SettingsLayout() {
  const hiddenTaxonomyItems = useUiStore(state => state.hiddenTaxonomyItems);
  const hiddenCustomizationItems = useUiStore(state => state.hiddenCustomizationItems);

  const visibleNav = settingsNav.filter((item) => {
    if ("taxonomyKey" in item) return hiddenTaxonomyItems.includes(item.taxonomyKey);
    if ("customizationKey" in item) return hiddenCustomizationItems.includes(item.customizationKey);
    return true;
  });

  return (
    <TabbedEntityLayout
      header={(
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage custom properties, display preferences, and automations.
          </p>
        </div>
      )}
      nav={visibleNav}
      navAriaLabel="Settings sections"
    />
  );
}
