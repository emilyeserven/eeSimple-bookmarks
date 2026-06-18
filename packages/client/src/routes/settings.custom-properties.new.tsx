import type { CustomProperty } from "@eesimple/types";

import { useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { PropertyForm } from "../components/PropertyForm";
import { useCategories } from "../hooks/useCategories";
import { useCreateCustomProperty, useCustomProperties } from "../hooks/useCustomProperties";

export const Route = createFileRoute("/settings/custom-properties/new")({
  component: NewCustomPropertyPage,
});

function NewCustomPropertyPage() {
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: categories,
  } = useCategories();
  const createProperty = useCreateCustomProperty();

  const numberProperties = (properties ?? []).filter(property => property.type === "number");

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <Link
          to="/settings/custom-properties"
          className="
            inline-block text-sm text-muted-foreground
            hover:text-foreground
          "
        >
          ← Back to custom properties
        </Link>
        <h1 className="text-2xl font-bold">New custom property</h1>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <PropertyForm
          mode="create"
          categories={categories ?? []}
          numberProperties={numberProperties}
          onSubmit={payload => createProperty.mutate(payload, {
            onSuccess: (created) => {
              // Seed the list cache so the destination view finds the property before the refetch.
              queryClient.setQueryData<CustomProperty[]>(
                ["custom-properties"],
                prev => (prev ? [...prev, created] : [created]),
              );
              void navigate({
                to: "/settings/custom-properties/$propertySlug",
                params: {
                  propertySlug: created.slug,
                },
              });
            },
          })}
          submitLabel="Add property"
          pendingLabel="Adding…"
          errorMessage={createProperty.isError ? createProperty.error.message : undefined}
          idPrefix="new-property-category"
        />
      </div>
    </section>
  );
}
