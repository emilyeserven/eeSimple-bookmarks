import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityEditView } from "../components/workbench/EntityEditView";
import { mediaTypeWorkbench } from "../components/workbench/mediaType";
import { useMediaTypeBySlug } from "../hooks/useMediaTypes";

import { validateEditTabSearch } from "@/lib/infoTabSearch";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/edit/")({
  validateSearch: validateEditTabSearch,
  component: MediaTypeEditPage,
});

function MediaTypeEditPage() {
  const {
    t,
  } = useTranslation();
  const {
    mediaTypeSlug,
  } = Route.useParams();
  const {
    tab,
  } = Route.useSearch();
  const {
    mediaType, isLoading,
  } = useMediaTypeBySlug(mediaTypeSlug);

  return (
    <EntityEditView
      workbench={mediaTypeWorkbench}
      slug={mediaTypeSlug}
      editTo="/taxonomies/media-types/$mediaTypeSlug/edit"
      params={{
        mediaTypeSlug,
      }}
      activeTab={tab}
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/media-types/$mediaTypeSlug"
            params={{
              mediaTypeSlug,
            }}
            className="
              text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            {t("← Back to {{name}}", {
              name: isLoading ? t("media type") : (mediaType?.name ?? t("media type")),
            })}
          </Link>
          <h1 className="text-2xl font-bold">{t("Edit media type")}</h1>
        </div>
      )}
    />
  );
}
