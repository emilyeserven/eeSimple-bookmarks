import { createFileRoute } from "@tanstack/react-router";

import { PropertyEditForm } from "../components/PropertyEditForm";
import { PropertyTabWrapper } from "../components/PropertyTabWrapper";

export const Route = createFileRoute("/custom-properties/$propertySlug/edit/categories")({
  component: CategoriesEditTab,
});

function CategoriesEditTab() {
  const {
    propertySlug,
  } = Route.useParams();
  return (
    <PropertyTabWrapper
      propertySlug={propertySlug}
      title="Categories"
      description="Choose which categories this property applies to."
    >
      {property => (
        <PropertyEditForm
          property={property}
          section="categories"
        />
      )}
    </PropertyTabWrapper>
  );
}
