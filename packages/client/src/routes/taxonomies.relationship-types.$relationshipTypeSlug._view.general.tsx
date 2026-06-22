import { createFileRoute } from "@tanstack/react-router";

import { RelationshipTypeDetail } from "../components/RelationshipTypeDetail";
import { RelationshipTypeTabWrapper } from "../components/RelationshipTypeTabWrapper";

export const Route = createFileRoute(
  "/taxonomies/relationship-types/$relationshipTypeSlug/_view/general",
)({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    relationshipTypeSlug,
  } = Route.useParams();
  return (
    <RelationshipTypeTabWrapper
      relationshipTypeSlug={relationshipTypeSlug}
      title="General"
      description="Direction, usage counts, and metadata."
    >
      {relationshipType => <RelationshipTypeDetail relationshipType={relationshipType} />}
    </RelationshipTypeTabWrapper>
  );
}
