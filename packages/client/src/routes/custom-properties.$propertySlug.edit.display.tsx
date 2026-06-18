import { createFileRoute } from "@tanstack/react-router";

import { PropertyEditForm } from "../components/PropertyEditForm";
import { PropertyTabWrapper } from "../components/PropertyTabWrapper";

export const Route = createFileRoute("/custom-properties/$propertySlug/edit/display")({
  component: DisplayEditTab,
});

function DisplayEditTab() {
  const {
    propertySlug,
  } = Route.useParams();
  return (
    <PropertyTabWrapper
      propertySlug={propertySlug}
      title="Display"
      description="Where this property appears and whether it's editable from the card menu."
    >
      {property => (
        <PropertyEditForm
          property={property}
          section="display"
        />
      )}
    </PropertyTabWrapper>
  );
}
