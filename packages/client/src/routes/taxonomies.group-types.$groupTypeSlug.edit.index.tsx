import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { groupTypeWorkbench } from "../components/workbench/groupType";
import { useGroupTypeBySlug } from "../hooks/useGroupTypes";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/group-types/$groupTypeSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: GroupTypeEditPage,
});

function GroupTypeEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    groupTypeSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    groupType, isLoading,
  } = useGroupTypeBySlug(groupTypeSlug);

  return (
    <EntityEditView
      workbench={groupTypeWorkbench}
      slug={groupTypeSlug}
      editTo="/taxonomies/group-types/$groupTypeSlug/edit"
      params={{
        groupTypeSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/group-types/$groupTypeSlug"
            params={{
              groupTypeSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("group type") : (groupType?.name ?? t("group type")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit group type")}</h1>
        </div>
      )}
    />
  );
}
