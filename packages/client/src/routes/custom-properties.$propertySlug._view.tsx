import { Link, createFileRoute, useRouterState } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteCustomProperty, usePropertyBySlug } from "../hooks/useCustomProperties";
import { hasPropertyOptions } from "../lib/propertyForm";
import { TYPE_LABELS } from "../lib/propertyFormat";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/custom-properties/$propertySlug/_view")({
  component: CustomPropertyViewLayout,
});

const VIEW_TO_EDIT = {
  "general": "/custom-properties/$propertySlug/edit/general",
  "options": "/custom-properties/$propertySlug/edit/options",
  "categories": "/custom-properties/$propertySlug/edit/categories",
  "media-types": "/custom-properties/$propertySlug/edit/media-types",
  "display": "/custom-properties/$propertySlug/edit/display",
  "autofill": "/custom-properties/$propertySlug/edit/autofill",
} as const;
type PropertyEditRoute = typeof VIEW_TO_EDIT[keyof typeof VIEW_TO_EDIT];

function CustomPropertyViewLayout() {
  const {
    propertySlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const pathname = useRouterState({
    select: s => s.location.pathname,
  });
  const editRoute: PropertyEditRoute = (VIEW_TO_EDIT[pathname.split("/").at(-1) as keyof typeof VIEW_TO_EDIT] ?? VIEW_TO_EDIT.general) as PropertyEditRoute;
  const {
    property, isLoading,
  } = usePropertyBySlug(propertySlug);
  const deleteProperty = useDeleteCustomProperty();

  // The "Options" tab only exists when the property has options (number / calculate / datetime).
  const viewNav = [
    {
      to: "/custom-properties/$propertySlug/general",
      label: "General",
    },
    ...(property && hasPropertyOptions(property)
      ? [{
        to: "/custom-properties/$propertySlug/options",
        label: "Options",
      }] as const
      : []),
    {
      to: "/custom-properties/$propertySlug/categories",
      label: "Categories",
    },
    {
      to: "/custom-properties/$propertySlug/media-types",
      label: "Media Types",
    },
    {
      to: "/custom-properties/$propertySlug/display",
      label: "Display",
    },
    {
      to: "/custom-properties/$propertySlug/autofill",
      label: "Autofill Rules",
    },
  ] as const;

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/custom-properties"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to custom properties
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading ? "Custom property" : (property?.name ?? "Custom property not found")}
              {property?.builtIn ? <Badge variant="secondary">Built-in</Badge> : null}
              {property && !property.enabled ? <Badge variant="outline">Disabled</Badge> : null}
              {property ? <Badge variant="secondary">{TYPE_LABELS[property.type]}</Badge> : null}
            </h1>
            {property
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to={editRoute}
                      params={{
                        propertySlug,
                      }}
                    >
                      Edit
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="
                      text-destructive
                      hover:text-destructive
                    "
                    onClick={() => deleteProperty.mutate(property.id, {
                      onSuccess: () => navigate({
                        to: "/custom-properties",
                      }),
                    })}
                  >
                    Delete
                  </Button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        propertySlug,
      }}
      navAriaLabel="Custom property sections"
    />
  );
}
