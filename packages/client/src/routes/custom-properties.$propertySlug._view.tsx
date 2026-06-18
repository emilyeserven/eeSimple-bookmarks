import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

import { useDeleteCustomProperty, usePropertyBySlug } from "../hooks/useCustomProperties";
import { hasPropertyOptions } from "../lib/propertyForm";
import { TYPE_LABELS } from "../lib/propertyFormat";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/custom-properties/$propertySlug/_view")({
  component: CustomPropertyViewLayout,
});

const navLinkClass = `
  rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors
  hover:bg-accent hover:text-accent-foreground
`;

function CustomPropertyViewLayout() {
  const {
    propertySlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
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
      to: "/custom-properties/$propertySlug/display",
      label: "Display",
    },
    {
      to: "/custom-properties/$propertySlug/autofill",
      label: "Autofill Rules",
    },
  ] as const;

  return (
    <section className="space-y-6">
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
                    to="/custom-properties/$propertySlug/edit/general"
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
          aria-label="Custom property sections"
        >
          {viewNav.map(item => (
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
