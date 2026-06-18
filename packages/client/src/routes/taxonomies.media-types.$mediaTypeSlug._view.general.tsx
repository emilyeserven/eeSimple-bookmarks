import { createFileRoute } from "@tanstack/react-router";

import { TabWrapper } from "../components/TabWrapper";
import { useMediaTypeBySlug } from "../hooks/useMediaTypes";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/_view/general")({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  const {
    mediaType, isLoading,
  } = useMediaTypeBySlug(mediaTypeSlug);
  return (
    <TabWrapper
      entity={mediaType}
      isLoading={isLoading}
      notFoundMessage="Media type not found."
      title="General"
      description="Name, sort order, and metadata."
    >
      {mt => (
        <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Added</dt>
          <dd>{new Date(mt.createdAt).toLocaleDateString()}</dd>
          <dt className="text-muted-foreground">Slug</dt>
          <dd className="font-mono">{mt.slug}</dd>
          <dt className="text-muted-foreground">Sort order</dt>
          <dd>{mt.sortOrder}</dd>
          {mt.bookmarkCount != null
            ? (
              <>
                <dt className="text-muted-foreground">Bookmarks</dt>
                <dd>{mt.bookmarkCount}</dd>
              </>
            )
            : null}
        </dl>
      )}
    </TabWrapper>
  );
}
