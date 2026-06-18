import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout, navLinkClass } from "../components/TabbedEntityLayout";
import { useMediaTypeBySlug } from "../hooks/useMediaTypes";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/edit")({
  component: MediaTypeEditLayout,
});

const editNav = [
  {
    to: "/taxonomies/media-types/$mediaTypeSlug/edit/general",
    label: "General",
  },
] as const;

function MediaTypeEditLayout() {
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
            ← Back to {isLoading ? "media type" : (mediaType?.name ?? "media type")}
          </Link>
          <h1 className="text-2xl font-bold">Edit media type</h1>
        </div>
      )}
      nav={(
        <nav
          className="
            flex shrink-0 flex-col gap-1
            sm:w-48
          "
          aria-label="Media type edit sections"
        >
          {editNav.map(item => (
            <Link
              key={item.to}
              to={item.to}
              params={{
                mediaTypeSlug,
              }}
              className={cn(navLinkClass)}
              activeProps={{
                className: "bg-accent text-accent-foreground",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    />
  );
}
