import { createFileRoute } from "@tanstack/react-router";

import { PropertyDisplayFields } from "../components/PropertyDetail";
import { PropertyTabWrapper } from "../components/PropertyTabWrapper";

export const Route = createFileRoute("/custom-properties/$propertySlug/_view/display")({
  component: DisplayViewTab,
});

function DisplayViewTab() {
  const {
    propertySlug,
  } = Route.useParams();
  return (
    <PropertyTabWrapper
      propertySlug={propertySlug}
      title="Display"
      description="Where this property appears and whether it's editable from the card menu."
    >
      {property => <PropertyDisplayFields property={property} />}
    </PropertyTabWrapper>
  );
}
