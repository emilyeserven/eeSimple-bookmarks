import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useMediaTypeBySlug } from "../hooks/useMediaTypes";
import i18n from "../i18n";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/_view")({
  component: MediaTypeViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/media-types/$mediaTypeSlug/general",
    label: i18n.t("General"),
  },
  {
    to: "/taxonomies/media-types/$mediaTypeSlug/hierarchy",
    label: i18n.t("Hierarchy"),
  },
  {
    type: "group",
    label: i18n.t("Rules"),
    items: [
      {
        to: "/taxonomies/media-types/$mediaTypeSlug/autofill",
        label: i18n.t("Autofill Rules"),
      },
      {
        to: "/taxonomies/media-types/$mediaTypeSlug/display-rules",
        label: i18n.t("Display Rules"),
      },
    ],
  },
] as const;

function MediaTypeViewLayout() {
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
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {mediaType
            ? (
              <RomanizedLabel
                name={mediaType.name}
                romanized={mediaType.romanizedName}
              />
            )
            : (isLoading ? t("Media type") : t("Media type not found"))}
          {mediaType?.builtIn ? <Badge variant="secondary">{t("Built-in")}</Badge> : null}
        </h1>
      )}
      nav={viewNav}
      params={{
        mediaTypeSlug,
      }}
      navAriaLabel={t("Media type sections")}
    />
  );
}
