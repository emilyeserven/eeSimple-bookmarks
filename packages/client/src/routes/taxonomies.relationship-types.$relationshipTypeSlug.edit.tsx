import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useRelationshipTypeBySlug } from "../hooks/useRelationshipTypes";
import i18n from "../i18n";

export const Route = createFileRoute("/taxonomies/relationship-types/$relationshipTypeSlug/edit")({
  component: RelationshipTypeEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/relationship-types/$relationshipTypeSlug/edit/general",
    label: i18n.t("General"),
  },
] as const;

function RelationshipTypeEditLayout() {
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
        <div className="space-y-1">
          <Link
            to="/taxonomies/relationship-types/$relationshipTypeSlug"
            params={{
              relationshipTypeSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading
                ? t("relationship type")
                : (relationshipType?.name ?? t("relationship type")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit relationship type")}</h1>
        </div>
      )}
      nav={editNav}
      params={{
        relationshipTypeSlug,
      }}
      navAriaLabel={t("Relationship type edit sections")}
    />
  );
}
