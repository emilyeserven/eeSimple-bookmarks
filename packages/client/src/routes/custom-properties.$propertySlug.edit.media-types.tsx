import { createFileRoute } from "@tanstack/react-router";

import { PropertyEditForm } from "../components/PropertyEditForm";
import { PropertyTabWrapper } from "../components/PropertyTabWrapper";

export const Route = createFileRoute("/custom-properties/$propertySlug/edit/media-types")({
  component: MediaTypesEditTab,
});

function MediaTypesEditTab() {
  const {
    propertySlug,
  } = Route.useParams();
  return (
    <PropertyTabWrapper
      propertySlug={propertySlug}
      title="Media Types"
      description="Also show this property on bookmarks of the chosen media types (in addition to its categories)."
    >
      {property => (
        <PropertyEditForm
          property={property}
          section="media-types"
        />
      )}
    </PropertyTabWrapper>
  );
}
