import { Link, createFileRoute } from "@tanstack/react-router";

import { PropertyForm } from "../components/PropertyForm";
import { useCategories } from "../hooks/useCategories";
import { usePropertyBySlug, useUpdateCustomProperty } from "../hooks/useCustomProperties";

export const Route = createFileRoute("/custom-properties/$propertySlug/edit")({
  component: CustomPropertyEditPage,
});

function CustomPropertyEditPage() {
  const {
    propertySlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    property, data: properties, isLoading, error,
  } = usePropertyBySlug(propertySlug);
  const {
    data: categories,
  } = useCategories();
  const updateProperty = useUpdateCustomProperty();

  // A calculate property may sum any other number property, but never itself.
  const numberProperties = (properties ?? []).filter(
    candidate => candidate.type === "number" && candidate.id !== property?.id,
  );

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
        <h1 className="text-2xl font-bold">Edit custom property</h1>
      </div>

      {isLoading ? <p className="text-muted-foreground">Loading custom property…</p> : null}
      {error || (!isLoading && !property)
        ? <p className="text-destructive">{error?.message ?? "Custom property not found."}</p>
        : null}
      {property
        ? (
          <div className="rounded-lg border bg-card p-4">
            <PropertyForm
              mode="edit"
              property={property}
              categories={categories ?? []}
              numberProperties={numberProperties}
              onSubmit={({
                type, ...input
              }) => updateProperty.mutate({
                id: property.id,
                input,
              }, {
                // Renaming can change the slug, so navigate to the property's returned slug.
                onSuccess: updated => navigate({
                  to: "/custom-properties/$propertySlug",
                  params: {
                    propertySlug: updated.slug,
                  },
                }),
              })}
              submitLabel="Save changes"
              pendingLabel="Saving…"
              errorMessage={updateProperty.isError ? updateProperty.error.message : undefined}
              idPrefix={`property-${property.id}-category`}
            />
          </div>
        )
        : null}
    </section>
  );
}
