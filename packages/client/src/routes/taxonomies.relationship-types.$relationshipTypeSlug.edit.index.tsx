import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { relationshipTypeWorkbench } from "../components/workbench/relationshipType";
import { useRelationshipTypeBySlug } from "../hooks/useRelationshipTypes";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/relationship-types/$relationshipTypeSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: RelationshipTypeEditPage,
});

function RelationshipTypeEditPage() {
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
    <EntityEditView
      workbench={relationshipTypeWorkbench}
      slug={relationshipTypeSlug}
      editTo="/taxonomies/relationship-types/$relationshipTypeSlug/edit"
      params={{
        relationshipTypeSlug,
      }}
      activeTab={tab}
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
    />
  );
}
