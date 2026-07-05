import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useGroupTypeBySlug } from "../hooks/useGroupTypes";

export const Route = createFileRoute("/taxonomies/group-types/$groupTypeSlug/edit")({
  component: GroupTypeEditLayout,
});

function GroupTypeEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    groupTypeSlug,
  } = Route.useParams();
  const {
    groupType, isLoading,
  } = useGroupTypeBySlug(groupTypeSlug);
  const editNav = [
    {
      to: "/taxonomies/group-types/$groupTypeSlug/edit/general",
      label: t("General"),
    },
  ] as const;

  return (
    <TabbedEntityLayout
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
      nav={editNav}
      params={{
        groupTypeSlug,
      }}
      navAriaLabel={t("Group type edit sections")}
    />
  );
}
