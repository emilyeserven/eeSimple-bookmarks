import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

import { usePropertyBySlug } from "../hooks/useCustomProperties";
import { hasPropertyOptions } from "../lib/propertyForm";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/custom-properties/$propertySlug/edit")({
  component: CustomPropertyEditLayout,
});

const navLinkClass = `
  rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors
  hover:bg-accent hover:text-accent-foreground
`;

function CustomPropertyEditLayout() {
  const {
    propertySlug,
  } = Route.useParams();
  const {
    property, isLoading,
  } = usePropertyBySlug(propertySlug);

  // The "Options" tab only exists when the property has options (number / calculate / datetime).
  const editNav = [
    {
      to: "/custom-properties/$propertySlug/edit/general",
      label: "General",
    },
    ...(property && hasPropertyOptions(property)
      ? [{
        to: "/custom-properties/$propertySlug/edit/options",
        label: "Options",
      }] as const
      : []),
    {
      to: "/custom-properties/$propertySlug/edit/categories",
      label: "Categories",
    },
    {
      to: "/custom-properties/$propertySlug/edit/display",
      label: "Display",
    },
    {
      to: "/custom-properties/$propertySlug/edit/autofill",
      label: "Autofill Rules",
    },
  ] as const;

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <Link
          to="/custom-properties/$propertySlug"
          params={{
            propertySlug,
          }}
          className="
            text-sm text-muted-foreground
            hover:text-foreground
          "
        >
          ← Back to custom property
        </Link>
        <h1 className="text-2xl font-bold">
          {isLoading ? "Edit custom property" : (property?.name ?? "Custom property not found")}
        </h1>
        <p className="text-sm text-muted-foreground">
          Edit the general details, options, categories, display, and autofill rules for this property.
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
          aria-label="Custom property settings sections"
        >
          {editNav.map(item => (
            <Link
              key={item.to}
              to={item.to}
              params={{
                propertySlug,
              }}
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
