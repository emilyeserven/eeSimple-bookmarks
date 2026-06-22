import { createFileRoute } from "@tanstack/react-router";

import { CardDisplayRulesList } from "../components/CardDisplayRulesList";
import { MediaTypeTabWrapper } from "../components/MediaTypeTabWrapper";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/_view/display-rules")({
  component: DisplayRulesViewTab,
});

function DisplayRulesViewTab() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  return (
    <MediaTypeTabWrapper
      mediaTypeSlug={mediaTypeSlug}
      title="Display Rules"
      description="Card display rules whose conditions reference this media type."
    >
      {mediaType => <CardDisplayRulesList mediaTypeId={mediaType.id} />}
    </MediaTypeTabWrapper>
  );
}
