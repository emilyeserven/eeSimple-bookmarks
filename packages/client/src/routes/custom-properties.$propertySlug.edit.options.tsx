import { createFileRoute } from "@tanstack/react-router";

import { PropertyEditForm } from "../components/PropertyEditForm";
import { PropertyTabWrapper } from "../components/PropertyTabWrapper";

export const Route = createFileRoute("/custom-properties/$propertySlug/edit/options")({
  component: OptionsEditTab,
});

function OptionsEditTab() {
  const {
    propertySlug,
  } = Route.useParams();
  return (
    <PropertyTabWrapper
      propertySlug={propertySlug}
      title="Options"
      description="Type-specific configuration for this property."
    >
      {property => (
        <PropertyEditForm
          property={property}
          section="options"
        />
      )}
    </PropertyTabWrapper>
  );
}
