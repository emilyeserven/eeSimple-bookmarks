import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useGenreMoodBySlug } from "../hooks/useGenreMoods";

import i18n from "@/i18n";

export const Route = createFileRoute("/taxonomies/genres-moods/$genreMoodSlug/edit")({
  component: GenreMoodEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/genres-moods/$genreMoodSlug/edit/general",
    label: i18n.t("General"),
  },
] as const;

function GenreMoodEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    genreMoodSlug,
  } = Route.useParams();
  const {
    genreMood, isLoading,
  } = useGenreMoodBySlug(genreMoodSlug);

  return (
    <TabbedEntityLayout
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
      nav={editNav}
      params={{
        genreMoodSlug,
      }}
      navAriaLabel={t("Genres & Moods edit sections")}
    />
  );
}
