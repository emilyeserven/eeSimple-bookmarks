import { Link, createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeleteMediaProperty, useMediaPropertyBySlug } from "../hooks/useMediaProperties";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/taxonomies/media-properties/$mediaPropertySlug/_view")({
  component: MediaPropertyViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/media-properties/$mediaPropertySlug/general",
    label: "General",
  },
] as const;

function MediaPropertyViewLayout() {
  const {
    mediaPropertySlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    mediaProperty, isLoading,
  } = useMediaPropertyBySlug(mediaPropertySlug);
  const deleteMediaProperty = useDeleteMediaProperty();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <Link
            to="/taxonomies/media-properties"
            className="
              inline-block text-sm text-muted-foreground
              hover:text-foreground
            "
          >
            ← Back to media properties
          </Link>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="
                flex min-w-0 flex-wrap items-center gap-2 text-2xl font-bold
              "
            >
              {isLoading ? "Media property" : (mediaProperty?.name ?? "Media property not found")}
            </h1>
            {mediaProperty
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      to="/taxonomies/media-properties/$mediaPropertySlug/edit/general"
                      params={{
                        mediaPropertySlug,
                      }}
                    >
                      Edit
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
                    disabled={deleteMediaProperty.isPending}
                    onClick={() => deleteMediaProperty.mutate(mediaProperty.id, {
                      onSuccess: () => navigate({
                        to: "/taxonomies/media-properties",
                      }),
                    })}
                  >
                    {deleteMediaProperty.isPending ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        mediaPropertySlug,
      }}
      navAriaLabel="Media property sections"
    />
  );
}
