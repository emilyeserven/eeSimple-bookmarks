import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useRelationshipTypeBySlug } from "../hooks/useRelationshipTypes";

import i18n from "@/i18n";

export const Route = createFileRoute("/taxonomies/relationship-types/$relationshipTypeSlug/_view")({
  component: RelationshipTypeViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/relationship-types/$relationshipTypeSlug/general",
    label: i18n.t("General"),
  },
] as const;

function RelationshipTypeViewLayout() {
  const {
    t,
  } = useTranslation();
  const {
    relationshipTypeSlug,
  } = Route.useParams();
  const {
    relationshipType, isLoading,
  } = useRelationshipTypeBySlug(relationshipTypeSlug);

  return (
    <TabbedEntityLayout
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
      nav={viewNav}
      params={{
        relationshipTypeSlug,
      }}
      navAriaLabel={t("Relationship type sections")}
    />
  );
}
