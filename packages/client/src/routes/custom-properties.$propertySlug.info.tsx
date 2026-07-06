import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityInfoView } from "../components/workbench/EntityInfoView";
import { propertyWorkbench } from "../components/workbench/property";
import { useDeleteCustomProperty, usePropertyBySlug } from "../hooks/useCustomProperties";
import { validateInfoTabSearch } from "../lib/infoTabSearch";
import { TYPE_LABELS } from "../lib/propertyFormat";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/custom-properties/$propertySlug/info")({
  validateSearch: validateInfoTabSearch,
  component: CustomPropertyInfoTab,
});

const VIEW_TO_EDIT = {
  "general": "/custom-properties/$propertySlug/edit/general",
  "options": "/custom-properties/$propertySlug/edit/options",
  "categories": "/custom-properties/$propertySlug/edit/categories",
  "media-types": "/custom-properties/$propertySlug/edit/media-types",
  "display": "/custom-properties/$propertySlug/edit/display",
  "autofill": "/custom-properties/$propertySlug/edit/autofill",
  "display-rules": "/custom-properties/$propertySlug/edit/display-rules",
} as const;
type PropertyEditRoute = typeof VIEW_TO_EDIT[keyof typeof VIEW_TO_EDIT];

function CustomPropertyInfoTab() {
  const {
    t,
  } = useTranslation();
  const {
    propertySlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const navigate = Route.useNavigate();
  const editRoute: PropertyEditRoute
    = (VIEW_TO_EDIT[(tab ?? "general") as keyof typeof VIEW_TO_EDIT] ?? VIEW_TO_EDIT.general) as PropertyEditRoute;
  const {
    property, isLoading,
  } = usePropertyBySlug(propertySlug);
  const deleteProperty = useDeleteCustomProperty();

  return (
    <EntityInfoView
      workbench={propertyWorkbench}
      slug={propertySlug}
      infoTo="/custom-properties/$propertySlug/info"
      params={{
        propertySlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/custom-properties"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to custom properties")}
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading ? t("Custom property") : (property?.name ?? t("Custom property not found"))}
              {property?.builtIn ? <Badge variant="secondary">{t("Built-in")}</Badge> : null}
              {property && !property.enabled ? <Badge variant="outline">{t("Disabled")}</Badge> : null}
              {property ? <Badge variant="secondary">{TYPE_LABELS[property.type]}</Badge> : null}
            </h1>
            {property
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to={editRoute}
                      params={{
                        propertySlug,
                      }}
                    >
                      {t("Edit")}
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="
                      text-destructive
                      hover:text-destructive
                    "
                    onClick={() => deleteProperty.mutate(property.id, {
                      onSuccess: () => navigate({
                        to: "/custom-properties",
                      }),
                    })}
                  >
                    {t("Delete")}
                  </Button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
    />
  );
}
