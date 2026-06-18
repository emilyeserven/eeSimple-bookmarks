import { Link, createFileRoute } from "@tanstack/react-router";

import { PropertyDetail } from "../components/PropertyDetail";
import { useCategories } from "../hooks/useCategories";
import { useDeleteCustomProperty, usePropertyBySlug } from "../hooks/useCustomProperties";

import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/custom-properties/$propertySlug/")({
  component: CustomPropertyDetailPage,
});

function CustomPropertyDetailPage() {
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
  const deleteProperty = useDeleteCustomProperty();

  const backLink = (
    <Link
      to="/custom-properties"
      className="
        inline-block text-sm text-muted-foreground
        hover:text-foreground
      "
    >
      ← Back to custom properties
    </Link>
  );

  if (isLoading) {
    return <p className="text-muted-foreground">Loading custom property…</p>;
  }

  if (error || !property) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error?.message ?? "Custom property not found."}</p>
        {backLink}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {backLink}
      <Card className="p-4">
        <PropertyDetail
          property={property}
          categories={categories ?? []}
          allProperties={properties ?? []}
          onEdit={() => navigate({
            to: "/custom-properties/$propertySlug/edit",
            params: {
              propertySlug,
            },
          })}
          onDelete={() => deleteProperty.mutate(property.id, {
            onSuccess: () => navigate({
              to: "/custom-properties",
            }),
          })}
        />
      </Card>
    </section>
  );
}
