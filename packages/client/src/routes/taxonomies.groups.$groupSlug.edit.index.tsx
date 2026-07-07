import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { groupWorkbench } from "../components/workbench/group";
import { useGroupBySlug } from "../hooks/useGroups";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/groups/$groupSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: GroupEditPage,
});

function GroupEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    groupSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    group, isLoading,
  } = useGroupBySlug(groupSlug);

  return (
    <EntityEditView
      workbench={groupWorkbench}
      slug={groupSlug}
      editTo="/taxonomies/groups/$groupSlug/edit"
      params={{
        groupSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/groups/$groupSlug"
            params={{
              groupSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("group") : (group?.name ?? t("group")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit group")}</h1>
        </div>
      )}
    />
  );
}
