import { createFileRoute } from "@tanstack/react-router";

import { EntityAutofillSources } from "../components/EntityAutofillSources";
import { MediaTypeTabWrapper } from "../components/MediaTypeTabWrapper";
import { useMediaTypes } from "../hooks/useMediaTypes";

import { CategoryIcon } from "@/lib/icons";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/_view/general")({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  const {
    data: allMediaTypes,
  } = useMediaTypes();
  return (
    <MediaTypeTabWrapper
      mediaTypeSlug={mediaTypeSlug}
      title="General"
      description="Name, sort order, and metadata."
    >
      {mt => (
        <div className="space-y-6">
          <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Added</dt>
            <dd>{new Date(mt.createdAt).toLocaleDateString()}</dd>
            <dt className="text-muted-foreground">Slug</dt>
            <dd className="font-mono">{mt.slug}</dd>
            {mt.parentId != null
              ? (
                <>
                  <dt className="text-muted-foreground">Parent</dt>
                  <dd>{(allMediaTypes ?? []).find(m => m.id === mt.parentId)?.name ?? "—"}</dd>
                </>
              )
              : null}
            <dt className="text-muted-foreground">Icon</dt>
            <dd>
              {mt.icon
                ? (
                  <CategoryIcon
                    name={mt.icon}
                    className="size-4"
                  />
                )
                : <span className="text-muted-foreground">None</span>}
            </dd>
            <dt className="text-muted-foreground">Sort order</dt>
            <dd>{mt.sortOrder}</dd>
            <dt className="text-muted-foreground">Built-in</dt>
            <dd>{mt.builtIn ? "Yes" : "No"}</dd>
            {mt.bookmarkCount != null
              ? (
                <>
                  <dt className="text-muted-foreground">Bookmarks</dt>
                  <dd>{mt.bookmarkCount}</dd>
                </>
              )
              : null}
          </dl>
          <EntityAutofillSources
            match={{
              kind: "media-type",
              mediaTypeId: mt.id,
            }}
          />
        </div>
      )}
    </MediaTypeTabWrapper>
  );
}
