import { createFileRoute } from "@tanstack/react-router";

import { PropertyOptionsForm } from "../components/PropertyOptionsForm";
import { PropertyTabWrapper } from "../components/PropertyTabWrapper";
import { useCustomProperties } from "../hooks/useCustomProperties";

export const Route = createFileRoute("/custom-properties/$propertySlug/edit/options")({
  component: OptionsEditTab,
});

function OptionsEditTab() {
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
        <PropertyOptionsForm
          property={property}
          // A calculate property may sum any other number property, but never itself.
          numberProperties={(properties ?? []).filter(
            candidate => candidate.type === "number" && candidate.id !== property.id,
          )}
        />
      )}
    </PropertyTabWrapper>
  );
}
