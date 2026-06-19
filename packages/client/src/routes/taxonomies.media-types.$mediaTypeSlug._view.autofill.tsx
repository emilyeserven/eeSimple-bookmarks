import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesList } from "../components/AutofillRulesList";
import { MediaTypeTabWrapper } from "../components/MediaTypeTabWrapper";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/_view/autofill")({
  component: AutofillViewTab,
});

function AutofillViewTab() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  return (
    <MediaTypeTabWrapper
      mediaTypeSlug={mediaTypeSlug}
      title="Autofill Rules"
      description="Autofill rules that set this media type on matching bookmarks."
    >
      {mediaType => <AutofillRulesList mediaTypeId={mediaType.id} />}
    </MediaTypeTabWrapper>
  );
}
