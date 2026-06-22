import { createFileRoute } from "@tanstack/react-router";

import { CardDisplayRulesList } from "../components/CardDisplayRulesList";
import { PropertyTabWrapper } from "../components/PropertyTabWrapper";

export const Route = createFileRoute("/custom-properties/$propertySlug/_view/display-rules")({
  component: DisplayRulesViewTab,
});

function DisplayRulesViewTab() {
  const {
    propertySlug,
  } = Route.useParams();
  return (
    <PropertyTabWrapper
      propertySlug={propertySlug}
      title="Display Rules"
      description="Card display rules whose conditions reference this property."
    >
      {property => <CardDisplayRulesList propertyId={property.id} />}
    </PropertyTabWrapper>
  );
}
