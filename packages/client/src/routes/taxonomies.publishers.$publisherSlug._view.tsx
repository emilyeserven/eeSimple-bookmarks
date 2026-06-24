import { createFileRoute } from "@tanstack/react-router";

import { TabbedEntityLayout } from "../components/TabbedEntityLayout";
import { useDeletePublisher, usePublisherBySlug } from "../hooks/usePublishers";

export const Route = createFileRoute("/taxonomies/publishers/$publisherSlug/_view")({
  component: PublisherViewLayout,
});

const viewNav = [
  {
    to: "/taxonomies/publishers/$publisherSlug/general",
    label: "General",
  },
] as const;

function PublisherViewLayout() {
  const {
    publisherSlug,
  } = Route.useParams();
  const navigate = Route.useNavigate();
  const {
    publisher, isLoading,
  } = usePublisherBySlug(publisherSlug);
  const deletePublisher = useDeletePublisher();

  return (
    <TabbedEntityLayout
      header={(
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold">
              {isLoading ? "Publisher" : (publisher?.name ?? "Publisher not found")}
            </h1>
            {publisher
              ? (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="
                      inline-flex items-center justify-center rounded-md border
                      bg-background px-3 py-1.5 text-sm font-medium
                      hover:bg-accent hover:text-accent-foreground
                    "
                    onClick={() => void navigate({
                      to: "/taxonomies/publishers/$publisherSlug/edit/general",
                      params: {
                        publisherSlug,
                      },
                    })}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="
                      inline-flex items-center justify-center rounded-md px-3
                      py-1.5 text-sm font-medium text-destructive
                      hover:text-destructive/80
                    "
                    disabled={deletePublisher.isPending}
                    onClick={() => deletePublisher.mutate(publisher.id, {
                      onSuccess: () => navigate({
                        to: "/taxonomies/publishers",
                      }),
                    })}
                  >
                    {deletePublisher.isPending ? "Deleting…" : "Delete"}
                  </button>
                </div>
              )
              : null}
          </div>
        </div>
      )}
      nav={viewNav}
      params={{
        publisherSlug,
      }}
      navAriaLabel="Publisher sections"
    />
  );
}
