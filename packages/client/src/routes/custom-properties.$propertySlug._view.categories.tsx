import { createFileRoute } from "@tanstack/react-router";

import { PropertyCategoriesContent } from "../components/PropertyDetail";
import { PropertyTabWrapper } from "../components/PropertyTabWrapper";
import { useCategories } from "../hooks/useCategories";

export const Route = createFileRoute("/custom-properties/$propertySlug/_view/categories")({
  component: CategoriesViewTab,
});

function CategoriesViewTab() {
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
      description="The categories this property applies to."
    >
      {property => (
        <PropertyCategoriesContent
          property={property}
          categories={categories ?? []}
        />
      )}
    </PropertyTabWrapper>
  );
}
