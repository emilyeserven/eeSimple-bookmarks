import { Link, createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useMediaTypeBySlug } from "../hooks/useMediaTypes";

import i18n from "@/i18n";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/edit")({
  component: MediaTypeEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/media-types/$mediaTypeSlug/edit/general",
    label: i18n.t("General"),
  },
  {
    type: "group",
    label: i18n.t("Rules"),
    items: [
      {
        to: "/taxonomies/media-types/$mediaTypeSlug/edit/autofill",
        label: i18n.t("Autofill Rules"),
      },
      {
        to: "/taxonomies/media-types/$mediaTypeSlug/edit/display-rules",
        label: i18n.t("Display Rules"),
      },
    ],
  },
] as const;

function MediaTypeEditLayout() {
  const {
    t,
  } = useTranslation();
  const {
    mediaTypeSlug,
  } = Route.useParams();
  const {
    mediaType, isLoading,
  } = useMediaTypeBySlug(mediaTypeSlug);

  return (
    <TabbedEntityLayout
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
      nav={editNav}
      params={{
        mediaTypeSlug,
      }}
      navAriaLabel={t("Media type edit sections")}
    />
  );
}
