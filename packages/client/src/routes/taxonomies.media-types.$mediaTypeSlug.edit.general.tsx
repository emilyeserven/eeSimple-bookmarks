import { createFileRoute } from "@tanstack/react-router";

import { MediaTypeGeneralForm } from "../components/MediaTypeGeneralForm";
import { MediaTypeTabWrapper } from "../components/MediaTypeTabWrapper";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  return (
    <MediaTypeTabWrapper
      mediaTypeSlug={mediaTypeSlug}
      title="General"
      description="Name and sort order."
    >
      {mt => <MediaTypeGeneralForm mediaType={mt} />}
    </MediaTypeTabWrapper>
  );
}
