import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout, navLinkClass } from "../components/TabbedEntityLayout";
import { usePropertyBySlug } from "../hooks/useCustomProperties";
import { hasPropertyOptions } from "../lib/propertyForm";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/custom-properties/$propertySlug/edit")({
  component: CustomPropertyEditLayout,
});

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
    <TabbedEntityLayout
      header={(
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
      )}
      nav={(
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
      )}
    />
  );
}
