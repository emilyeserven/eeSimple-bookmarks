import { createFileRoute } from "@tanstack/react-router";

import { AutofillRulesList } from "../components/AutofillRulesList";
import { PropertyTabWrapper } from "../components/PropertyTabWrapper";

export const Route = createFileRoute("/custom-properties/$propertySlug/_view/autofill")({
  component: AutofillViewTab,
});

function AutofillViewTab() {
  const {
    propertySlug,
  } = Route.useParams();
  return (
    <PropertyTabWrapper
      propertySlug={propertySlug}
      title="Autofill Rules"
      description="Autofill rules that set a value for this property when a matching bookmark is saved."
    >
      {property => <AutofillRulesList propertyId={property.id} />}
    </PropertyTabWrapper>
  );
}
