import type { MediaType } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { LabeledSection } from "./LabeledSection";
import { useEditPanelClick } from "./panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

function MediaTypeDetails({
  mediaType,
}: { mediaType: MediaType }) {
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Added</dt>
      <dd>{new Date(mediaType.createdAt).toLocaleDateString()}</dd>
      <dt className="text-muted-foreground">Slug</dt>
      <dd className="font-mono">{mediaType.slug}</dd>
      <dt className="text-muted-foreground">Sort order</dt>
      <dd>{mediaType.sortOrder}</dd>
      {mediaType.bookmarkCount != null
        ? (
          <>
            <dt className="text-muted-foreground">Bookmarks</dt>
            <dd>{mediaType.bookmarkCount}</dd>
          </>
        )
        : null}
    </dl>
  );
}

/** Read-only display card for a single media type. Shared by the view page and the right panel's View body. */
export function MediaTypeCard({
  mediaType,
}: { mediaType: MediaType }) {
  const editClick = useEditPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h2 className="text-xl font-semibold">{mediaType.name}</h2>
          {mediaType.builtIn
            ? <Badge variant="outline">Built-in</Badge>
            : null}
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link
            to="/taxonomies/media-types/$mediaTypeSlug/edit"
            params={{
              mediaTypeSlug: mediaType.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "media-type", mediaType.id)}
          >
            Edit
          </Link>
        </Button>
      </div>

      <Separator />

      <LabeledSection title="Details">
        <MediaTypeDetails mediaType={mediaType} />
      </LabeledSection>
    </div>
  );
}
