import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteMediaType, useMediaTypeBySlug } from "../hooks/useMediaTypes";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/_view")({
  component: MediaTypeViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/media-types/$mediaTypeSlug/general",
    label: "General",
  },
] as const;

function MediaTypeViewLayout() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    mediaType, isLoading,
  } = useMediaTypeBySlug(mediaTypeSlug);
  const deleteMediaType = useDeleteMediaType();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/media-types"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to media types
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading ? "Media type" : (mediaType?.name ?? "Media type not found")}
              {mediaType?.builtIn ? <Badge variant="secondary">Built-in</Badge> : null}
            </h1>
            {mediaType
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to="/taxonomies/media-types/$mediaTypeSlug/edit/general"
                      params={{
                        mediaTypeSlug,
                      }}
                    >
                      Edit
                    </Link>
                  </Button>
                  {!mediaType.builtIn
                    ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="
                          text-destructive
                          hover:text-destructive
                        "
                        disabled={deleteMediaType.isPending}
                        onClick={() => deleteMediaType.mutate(mediaType.id, {
                          onSuccess: () => navigate({
                            to: "/taxonomies/media-types",
                          }),
                        })}
                      >
                        {deleteMediaType.isPending ? "Deleting…" : "Delete"}
                      </Button>
                    )
                    : null}
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        mediaTypeSlug,
      }}
      navAriaLabel="Media type sections"
    />
  );
}
