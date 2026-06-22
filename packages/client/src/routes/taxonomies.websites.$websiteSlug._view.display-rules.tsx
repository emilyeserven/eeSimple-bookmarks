import { createFileRoute } from "@tanstack/react-router";

import { CardDisplayRulesList } from "../components/CardDisplayRulesList";
import { WebsiteTabWrapper } from "../components/WebsiteTabWrapper";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/_view/display-rules")({
  component: DisplayRulesViewTab,
});

function DisplayRulesViewTab() {
  const {
    websiteSlug,
  } = Route.useParams();
  return (
    <WebsiteTabWrapper
      websiteSlug={websiteSlug}
      title="Display Rules"
      description="Card display rules whose conditions target this website."
    >
      {website => <CardDisplayRulesList websiteId={website.id} />}
    </WebsiteTabWrapper>
  );
}
