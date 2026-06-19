import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesList } from "../components/AutofillRulesList";
import { SourceAutofillDefaults } from "../components/SourceAutofillDefaults";
import { WebsiteTabWrapper } from "../components/WebsiteTabWrapper";

export const Route = createFileRoute("/taxonomies/websites/$websiteSlug/_view/autofill")({
  component: AutofillViewTab,
});

function AutofillViewTab() {
  const {
    websiteSlug,
  } = Route.useParams();
  return (
    <WebsiteTabWrapper
      websiteSlug={websiteSlug}
      title="Autofill Rules"
      description="Autofill rules whose conditions target this website."
    >
      {website => (
        <div className="space-y-6">
          <SourceAutofillDefaults
            kind="website"
            category={website.category}
            tagIds={website.tagIds}
          />
          <AutofillRulesList websiteId={website.id} />
        </div>
      )}
    </WebsiteTabWrapper>
  );
}
