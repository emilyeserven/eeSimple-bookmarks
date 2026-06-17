import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsLayout,
});

const settingsNav = [
  {
    to: "/settings/custom-properties",
    label: "Custom Properties",
  },
  {
    to: "/settings/autofill",
    label: "Autofill",
  },
  {
    to: "/settings/display",
    label: "Display",
  },
  {
    to: "/settings/categories",
    label: "Categories",
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
          {settingsNav.map(item => (
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
