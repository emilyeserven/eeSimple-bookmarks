import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useLanguageBySlug } from "../hooks/useLanguages";
import i18n from "../i18n";

export const Route = createFileRoute("/taxonomies/languages/$languageSlug/edit")({
  component: LanguageEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/languages/$languageSlug/edit/general",
    label: i18n.t("General"),
  },
] as const;

function LanguageEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    languageSlug,
  } = Route.useParams();
  const {
    language, isLoading,
  } = useLanguageBySlug(languageSlug);

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/languages/$languageSlug"
            params={{
              languageSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading
                ? t("language")
                : (language?.name ?? t("language")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit language")}</h1>
        </div>
      )}
      nav={editNav}
      params={{
        languageSlug,
      }}
      navAriaLabel={t("Language edit sections")}
    />
  );
}
