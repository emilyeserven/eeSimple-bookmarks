import { createFileRoute } from "@tanstack/react-router";

import { PropertyDisplayForm } from "../components/PropertyDisplayForm";
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
      {property => <PropertyDisplayForm property={property} />}
    </PropertyTabWrapper>
  );
}
