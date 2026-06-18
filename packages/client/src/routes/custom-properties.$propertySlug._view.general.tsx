import { createFileRoute } from "@tanstack/react-router";

import { PropertyGeneralFields } from "../components/PropertyDetail";
import { PropertyTabWrapper } from "../components/PropertyTabWrapper";

export const Route = createFileRoute("/custom-properties/$propertySlug/_view/general")({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    propertySlug,
  } = Route.useParams();
  return (
    <PropertyTabWrapper
      propertySlug={propertySlug}
      title="General"
      description="Status, description, and when this property was created."
    >
      {property => <PropertyGeneralFields property={property} />}
    </PropertyTabWrapper>
  );
}
