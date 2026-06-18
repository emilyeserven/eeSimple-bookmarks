import { createFileRoute } from "@tanstack/react-router";

import { PropertyEditForm } from "../components/PropertyEditForm";
import { PropertyTabWrapper } from "../components/PropertyTabWrapper";

export const Route = createFileRoute("/custom-properties/$propertySlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    propertySlug,
  } = Route.useParams();
  return (
    <PropertyTabWrapper
      propertySlug={propertySlug}
      title="General"
      description="Name, status, and description."
    >
      {property => (
        <PropertyEditForm
          property={property}
          section="general"
        />
      )}
    </PropertyTabWrapper>
  );
}
