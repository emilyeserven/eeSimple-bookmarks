import { createFileRoute } from "@tanstack/react-router";

import { WebsiteGeneralForm } from "../components/WebsiteGeneralForm";
import { WebsiteTabWrapper } from "../components/WebsiteTabWrapper";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/edit/general")({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    websiteSlug,
  } = Route.useParams();
  return (
    <WebsiteTabWrapper
      websiteSlug={websiteSlug}
      title="General"
      description="Site name and domain."
    >
      {website => <WebsiteGeneralForm website={website} />}
    </WebsiteTabWrapper>
  );
}
