import { createFileRoute } from "@tanstack/react-router";

import { PropertyCategoriesForm } from "../components/PropertyCategoriesForm";
import { PropertyTabWrapper } from "../components/PropertyTabWrapper";
import { useCategories } from "../hooks/useCategories";

export const Route = createFileRoute("/custom-properties/$propertySlug/edit/categories")({
  component: CategoriesEditTab,
});

function CategoriesEditTab() {
  const {
    propertySlug,
  } = Route.useParams();
  const {
    data: categories,
  } = useCategories();
  return (
    <PropertyTabWrapper
      propertySlug={propertySlug}
      title="Categories"
      description="Choose which categories this property applies to."
    >
      {property => (
        <PropertyCategoriesForm
          property={property}
          categories={categories ?? []}
        />
      )}
    </PropertyTabWrapper>
  );
}
