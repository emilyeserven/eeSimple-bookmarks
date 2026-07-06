import { createFileRoute } from "@tanstack/react-router";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { newsletterWorkbench } from "../components/workbench/newsletter";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/newsletters/$newsletterSlug/_hub/info")({
  validateSearch: validateInfoTabSearch,
  component: NewsletterInfoTab,
});

function NewsletterInfoTab() {
  const {
    newsletterSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  return (
    <EntityInfoView
      workbench={newsletterWorkbench}
      slug={newsletterSlug}
      infoTo="/taxonomies/newsletters/$newsletterSlug/info"
      params={{
        newsletterSlug,
      }}
      activeTab={tab}
    />
  );
}
