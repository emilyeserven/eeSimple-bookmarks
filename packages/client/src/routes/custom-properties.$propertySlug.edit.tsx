import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { usePropertyBySlug } from "../hooks/useCustomProperties";
import { hasPropertyOptions } from "../lib/propertyForm";

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
      nav={editNav}
      params={{
        propertySlug,
      }}
      navAriaLabel="Custom property settings sections"
    />
  );
}
