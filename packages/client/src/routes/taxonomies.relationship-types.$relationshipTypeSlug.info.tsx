import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { relationshipTypeWorkbench } from "../components/workbench/relationshipType";
import { useRelationshipTypeBySlug } from "../hooks/useRelationshipTypes";
import { validateInfoTabSearch } from "../lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/relationship-types/$relationshipTypeSlug/info")({
  validateSearch: validateInfoTabSearch,
  component: RelationshipTypeInfoTab,
});

function RelationshipTypeInfoTab() {
  const {
    t,
  } = useTranslation();
  const {
    relationshipTypeSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    relationshipType, isLoading,
  } = useRelationshipTypeBySlug(relationshipTypeSlug);

  return (
    <EntityInfoView
      workbench={relationshipTypeWorkbench}
      slug={relationshipTypeSlug}
      infoTo="/taxonomies/relationship-types/$relationshipTypeSlug/info"
      params={{
        relationshipTypeSlug,
      }}
      activeTab={tab}
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading
            ? t("Relationship type")
            : (relationshipType?.name ?? t("Relationship type not found"))}
        </h1>
      )}
    />
  );
}
