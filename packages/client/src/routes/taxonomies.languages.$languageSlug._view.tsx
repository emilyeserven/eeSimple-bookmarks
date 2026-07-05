import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useLanguageBySlug } from "../hooks/useLanguages";

export const Route = createFileRoute("/taxonomies/languages/$languageSlug/_view")({
  component: LanguageViewLayout,
});

function LanguageViewLayout() {
  const {
    t,
  } = useTranslation();
  const {
    languageSlug,
  } = Route.useParams();
  const {
    language, isLoading,
  } = useLanguageBySlug(languageSlug);

  const viewNav = [
    {
      to: "/taxonomies/languages/$languageSlug/general",
      label: t("General"),
    },
  ] as const;

  return (
    <TabbedEntityLayout
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading ? t("Language") : (language?.name ?? t("Language not found"))}
        </h1>
      )}
      nav={viewNav}
      params={{
        languageSlug,
      }}
      navAriaLabel={t("Language sections")}
    />
  );
}
