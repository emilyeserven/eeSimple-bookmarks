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
    to: "/settings/gallery",
    label: "Gallery",
  },
  {
    to: "/settings/display",
    label: "Display",
  },
  {
    to: "/settings/sidebar",
    label: "Sidebar",
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

const navLinkClass = `
  rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors
  hover:bg-accent hover:text-accent-foreground
`;

function SettingsLayout() {
  const hiddenTaxonomyItems = useUiStore(state => state.hiddenTaxonomyItems);
  const hiddenCustomizationItems = useUiStore(state => state.hiddenCustomizationItems);

  const visibleNav = settingsNav.filter((item) => {
    if ("taxonomyKey" in item) return hiddenTaxonomyItems.includes(item.taxonomyKey);
    if ("customizationKey" in item) return hiddenCustomizationItems.includes(item.customizationKey);
    return true;
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage custom properties, display preferences, and automations.
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
