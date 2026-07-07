import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListingHubLayout } from "../components/ListingHubLayout";
import { LocalizedNameLabel } from "../components/LocalizedNameLabel";
import { useMediaTypeBySlug } from "../hooks/useMediaTypes";

import { Badge } from "@/components/ui/badge";

/**
 * The media-type listing shell: the entity header over the `Bookmarks | Gallery | Media | Info` strip,
 * shared by the bookmarks/gallery/media panes and the Info page. `edit` is a sibling of this pathless
 * layout, so the strip never shows while editing.
 */
export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/_hub")({
  component: MediaTypeHubLayout,
});

function MediaTypeHubLayout() {
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
    <ListingHubLayout
      header={(
        <h1
          className="
            flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
          "
        >
          {mediaType
            ? (
              <LocalizedNameLabel
                names={mediaType.names ?? []}
                base={mediaType.name}
              />
            )
            : (isLoading ? t("Media type") : t("Media type not found"))}
          {mediaType?.builtIn ? <Badge variant="secondary">{t("Built-in")}</Badge> : null}
        </h1>
      )}
      tabs={[
        {
          to: "/taxonomies/media-types/$mediaTypeSlug",
          label: t("Bookmarks"),
          exact: true,
        },
        {
          to: "/taxonomies/media-types/$mediaTypeSlug/gallery",
          label: t("Gallery"),
        },
        {
          to: "/taxonomies/media-types/$mediaTypeSlug/info",
          label: t("Info"),
        },
      ]}
      params={{
        mediaTypeSlug,
      }}
      navAriaLabel={t("Media type views")}
    />
  );
}
