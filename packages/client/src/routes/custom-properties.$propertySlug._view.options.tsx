import { createFileRoute } from "@tanstack/react-router";

import { PropertyOptionsFields } from "../components/PropertyDetail";
import { PropertyTabWrapper } from "../components/PropertyTabWrapper";
import { useCustomProperties } from "../hooks/useCustomProperties";

export const Route = createFileRoute("/custom-properties/$propertySlug/_view/options")({
  component: OptionsViewTab,
});

function OptionsViewTab() {
  const {
    propertySlug,
  } = Route.useParams();
  const {
    data: properties,
  } = useCustomProperties();
  return (
    <PropertyTabWrapper
      propertySlug={propertySlug}
      title="Options"
      description="Type-specific configuration for this property."
    >
      {property => (
        <PropertyOptionsFields
          property={property}
          allProperties={properties ?? []}
        />
      )}
    </PropertyTabWrapper>
  );
}
