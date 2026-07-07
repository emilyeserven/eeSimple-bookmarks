import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { languageWorkbench } from "../components/workbench/language";
import { useLanguageBySlug } from "../hooks/useLanguages";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/languages/$languageSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: LanguageEditPage,
});

function LanguageEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    languageSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    language, isLoading,
  } = useLanguageBySlug(languageSlug);

  return (
    <EntityEditView
      workbench={languageWorkbench}
      slug={languageSlug}
      editTo="/taxonomies/languages/$languageSlug/edit"
      params={{
        languageSlug,
      }}
      activeTab={tab}
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
    />
  );
}
