import { createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useLanguageBySlug } from "../hooks/useLanguages";

export const Route = createFileRoute("/taxonomies/languages/$languageSlug/_view")({
  component: LanguageViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/languages/$languageSlug/general",
    label: "General",
  },
] as const;

function LanguageViewLayout() {
  const {
    languageSlug,
  } = Route.useParams();
  const {
    language, isLoading,
  } = useLanguageBySlug(languageSlug);

  return (
    <TabbedEntityLayout
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {isLoading ? "Language" : (language?.name ?? "Language not found")}
        </h1>
      )}
      nav={viewNav}
      params={{
        languageSlug,
      }}
      navAriaLabel="Language sections"
    />
  );
}
