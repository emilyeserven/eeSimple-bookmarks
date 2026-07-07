import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { useLanguageBySlug } from "../hooks/useLanguages";

export const Route = createFileRoute("/taxonomies/languages/$languageSlug/_hub")({
  component: LanguageHubLayout,
});

function LanguageHubLayout() {
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
    <ListingHubLayout
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading ? t("Language") : (language?.name ?? t("Language not found"))}
        </h1>
      )}
      tabs={[
        {
          to: "/taxonomies/languages/$languageSlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/taxonomies/languages/$languageSlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/taxonomies/languages/$languageSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        languageSlug,
      }}
      navAriaLabel={t("Language sections")}
    />
  );
}
