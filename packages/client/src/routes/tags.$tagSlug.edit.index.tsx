import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { tagWorkbench } from "../components/workbench/tag";
import { useTagBySlug } from "../hooks/useTags";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/tags/$tagSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: TagEditPage,
});

function TagEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    tagSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    tag, isLoading,
  } = useTagBySlug(tagSlug);

  return (
    <EntityEditView
      workbench={tagWorkbench}
      slug={tagSlug}
      editTo="/tags/$tagSlug/edit"
      params={{
        tagSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/tags/$tagSlug"
            params={{
              tagSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("tag") : (tag?.name ?? t("tag")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit tag")}</h1>
        </div>
      )}
    />
  );
}
