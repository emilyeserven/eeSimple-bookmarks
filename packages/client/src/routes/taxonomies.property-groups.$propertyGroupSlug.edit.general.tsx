import { createFileRoute } from "@tanstack/react-router";

import { PropertyGroupGeneralForm } from "../components/PropertyGroupGeneralForm";
import { PropertyGroupTabWrapper } from "../components/PropertyGroupTabWrapper";

export const Route = createFileRoute(
  "/taxonomies/property-groups/$propertyGroupSlug/edit/general",
)({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    propertyGroupSlug,
  } = Route.useParams();
  return (
    <PropertyGroupTabWrapper
      propertyGroupSlug={propertyGroupSlug}
      title="General"
      description="Name, priority, and description."
    >
      {group => <PropertyGroupGeneralForm group={group} />}
    </PropertyGroupTabWrapper>
  );
}
