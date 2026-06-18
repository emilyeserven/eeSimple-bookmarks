import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

import { useUiStore } from "../stores/uiStore";

import { cn } from "@/lib/utils";

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
    to: "/settings/display",
    label: "Display",
  },
  {
    to: "/settings/homepage",
    label: "Homepage",
  },
  {
    to: "/settings/categories",
    label: "Categories",
    managementKey: "categories",
  },
  {
    to: "/settings/tags",
    label: "Tags",
    managementKey: "tags",
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
] as const;

const navLinkClass = `
  rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors
  hover:bg-accent hover:text-accent-foreground
`;

function SettingsLayout() {
  const hiddenTaxonomyItems = useUiStore(state => state.hiddenTaxonomyItems);
  const hiddenCustomizationItems = useUiStore(state => state.hiddenCustomizationItems);
  const hiddenManagementItems = useUiStore(state => state.hiddenManagementItems);

  const visibleNav = settingsNav.filter((item) => {
    if ("taxonomyKey" in item) return hiddenTaxonomyItems.includes(item.taxonomyKey);
    if ("customizationKey" in item) return hiddenCustomizationItems.includes(item.customizationKey);
    if ("managementKey" in item) return hiddenManagementItems.includes(item.managementKey);
    return true;
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage custom properties, display preferences, categories, and automations.
        </p>
      </div>

      <div
        className="
          flex flex-col gap-6
          sm:flex-row
        "
      >
        <nav
          className="
            flex shrink-0 flex-col gap-1
            sm:w-48
          "
          aria-label="Settings sections"
        >
          {visibleNav.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(navLinkClass)}
              activeProps={{
                className: "bg-accent text-accent-foreground",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </section>
  );
}
