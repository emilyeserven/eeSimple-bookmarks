import { createFileRoute } from "@tanstack/react-router";

import { PropertyMediaTypesContent } from "../components/PropertyDetail";
import { PropertyTabWrapper } from "../components/PropertyTabWrapper";
import { useMediaTypes } from "../hooks/useMediaTypes";

export const Route = createFileRoute("/custom-properties/$propertySlug/_view/media-types")({
  component: MediaTypesViewTab,
});

function MediaTypesViewTab() {
  const {
    propertySlug,
  } = Route.useParams();
  const {
    data: mediaTypes,
  } = useMediaTypes();
  return (
    <PropertyTabWrapper
      propertySlug={propertySlug}
      title="Media Types"
      description="The media types this property is also scoped to."
    >
      {property => (
        <PropertyMediaTypesContent
          property={property}
          mediaTypes={mediaTypes ?? []}
        />
      )}
    </PropertyTabWrapper>
  );
}
