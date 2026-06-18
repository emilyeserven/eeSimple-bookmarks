import { createFileRoute } from "@tanstack/react-router";

import { MediaTypeGeneralForm } from "../components/MediaTypeGeneralForm";
import { TabWrapper } from "../components/TabWrapper";
import { useMediaTypeBySlug } from "../hooks/useMediaTypes";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  const {
    mediaType, isLoading,
  } = useMediaTypeBySlug(mediaTypeSlug);
  return (
    <TabWrapper
      entity={mediaType}
      isLoading={isLoading}
      notFoundMessage="Media type not found."
      title="General"
      description="Name and sort order."
    >
      {mt => <MediaTypeGeneralForm mediaType={mt} />}
    </TabWrapper>
  );
}
