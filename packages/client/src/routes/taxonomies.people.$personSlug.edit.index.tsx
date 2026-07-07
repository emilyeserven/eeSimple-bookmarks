import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { personWorkbench } from "../components/workbench/person";
import { usePersonBySlug } from "../hooks/usePeople";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/people/$personSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: PersonEditPage,
});

function PersonEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    personSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    person, isLoading,
  } = usePersonBySlug(personSlug);

  return (
    <EntityEditView
      workbench={personWorkbench}
      slug={personSlug}
      editTo="/taxonomies/people/$personSlug/edit"
      params={{
        personSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/people/$personSlug"
            params={{
              personSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("person") : (person?.name ?? t("person")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit person")}</h1>
        </div>
      )}
    />
  );
}
