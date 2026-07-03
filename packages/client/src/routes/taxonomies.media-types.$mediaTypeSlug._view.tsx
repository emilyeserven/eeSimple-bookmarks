import { createFileRoute } from "@tanstack/react-router";

import { RomanizedLabel } from "../components/RomanizedLabel";
import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useMediaTypeBySlug } from "../hooks/useMediaTypes";

import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/_view")({
  component: MediaTypeViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/media-types/$mediaTypeSlug/general",
    label: "General",
  },
  {
    to: "/taxonomies/media-types/$mediaTypeSlug/hierarchy",
    label: "Hierarchy",
  },
  {
    type: "group",
    label: "Rules",
    items: [
      {
        to: "/taxonomies/media-types/$mediaTypeSlug/autofill",
        label: "Autofill Rules",
      },
      {
        to: "/taxonomies/media-types/$mediaTypeSlug/display-rules",
        label: "Display Rules",
      },
    ],
  },
] as const;

function MediaTypeViewLayout() {
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
            : (isLoading ? "Media type" : "Media type not found")}
          {mediaType?.builtIn ? <Badge variant="secondary">Built-in</Badge> : null}
        </h1>
      )}
      nav={viewNav}
      params={{
        mediaTypeSlug,
      }}
      navAriaLabel="Media type sections"
    />
  );
}
