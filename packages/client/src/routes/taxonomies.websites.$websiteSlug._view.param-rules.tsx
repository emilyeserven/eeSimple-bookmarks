import { createFileRoute } from "@tanstack/react-router";

import { ParamRulesList } from "../components/ParamRulesList";
import { WebsiteTabWrapper } from "../components/WebsiteTabWrapper";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/_view/param-rules")({
  component: ParamRulesViewTab,
});

function ParamRulesViewTab() {
  const {
    websiteSlug,
  } = Route.useParams();
  return (
    <WebsiteTabWrapper
      websiteSlug={websiteSlug}
      title="Param Rules"
      description="For matching paths, only these query params are kept; the rest are stripped."
    >
      {website => (
        <ParamRulesList
          rules={website.paramRules}
          emptyText="None configured."
        />
      )}
    </WebsiteTabWrapper>
  );
}
