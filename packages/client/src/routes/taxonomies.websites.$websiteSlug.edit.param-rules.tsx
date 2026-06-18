import { createFileRoute } from "@tanstack/react-router";

import { WebsiteParamRulesForm } from "../components/WebsiteParamRulesForm";
import { WebsiteTabWrapper } from "../components/WebsiteTabWrapper";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/edit/param-rules")({
  component: ParamRulesEditTab,
});

function ParamRulesEditTab() {
  const {
    websiteSlug,
  } = Route.useParams();
  return (
    <WebsiteTabWrapper
      websiteSlug={websiteSlug}
      title="Param Rules"
      description="Path-scoped query-param whitelist: only listed params are kept, the rest are stripped."
    >
      {website => <WebsiteParamRulesForm website={website} />}
    </WebsiteTabWrapper>
  );
}
