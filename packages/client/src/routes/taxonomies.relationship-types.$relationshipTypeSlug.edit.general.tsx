import { createFileRoute } from "@tanstack/react-router";

import { RelationshipTypeGeneralForm } from "../components/RelationshipTypeGeneralForm";
import { RelationshipTypeTabWrapper } from "../components/RelationshipTypeTabWrapper";

export const Route = createFileRoute(
  "/taxonomies/relationship-types/$relationshipTypeSlug/edit/general",
)({
  component: GeneralEditTab,
});

function GeneralEditTab() {
  const {
    relationshipTypeSlug,
  } = Route.useParams();
  return (
    <RelationshipTypeTabWrapper
      relationshipTypeSlug={relationshipTypeSlug}
      title="General"
      description="Name and direction."
    >
      {relationshipType => <RelationshipTypeGeneralForm relationshipType={relationshipType} />}
    </RelationshipTypeTabWrapper>
  );
}
