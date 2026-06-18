import { createFileRoute } from "@tanstack/react-router";

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
        website.paramRules.length === 0
          ? <p className="text-sm text-muted-foreground">None configured.</p>
          : (
            <ul className="space-y-2 text-sm">
              {website.paramRules.map((rule, index) => (
                <li
                  key={index}
                  className="rounded-md border p-2"
                >
                  <span className="font-mono">{rule.pathSuffix || "any path"}</span>
                  <span className="text-muted-foreground"> → </span>
                  <span className="font-mono">
                    {rule.params.length > 0 ? rule.params.join(", ") : "(none kept)"}
                  </span>
                </li>
              ))}
            </ul>
          )
      )}
    </WebsiteTabWrapper>
  );
}
