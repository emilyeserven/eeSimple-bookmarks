import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { genreMoodWorkbench } from "../components/workbench/genreMood";
import { useGenreMoodBySlug } from "../hooks/useGenreMoods";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/genres-moods/$genreMoodSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: GenreMoodEditPage,
});

function GenreMoodEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    genreMoodSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    genreMood, isLoading,
  } = useGenreMoodBySlug(genreMoodSlug);

  return (
    <EntityEditView
      workbench={genreMoodWorkbench}
      slug={genreMoodSlug}
      editTo="/taxonomies/genres-moods/$genreMoodSlug/edit"
      params={{
        genreMoodSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/genres-moods/$genreMoodSlug"
            params={{
              genreMoodSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("entry") : (genreMood?.name ?? t("entry")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit entry")}</h1>
        </div>
      )}
    />
  );
}
