import type { MediaType } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** A single row in the media-type listing: a link to the view page plus a hover edit button. */
export function MediaTypeListItem({
  mediaType,
}: { mediaType: MediaType }) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  return (
    <RowCard className="group relative transition-colors hover:bg-accent">
      <Link
        to="/taxonomies/media-types/$mediaTypeSlug"
        params={{
          mediaTypeSlug: mediaType.slug,
        }}
        title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
        onClick={event => viewClick(event, "media-type", mediaType.id)}
        className="flex items-center gap-3 p-4 pr-12"
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium">{mediaType.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {mediaType.builtIn ? "Built-in" : "Custom"}
          </p>
        </div>
        {mediaType.bookmarkCount !== undefined
          ? <Badge variant="secondary">{mediaType.bookmarkCount}</Badge>
          : null}
      </Link>
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="
          absolute top-1/2 right-2 -translate-y-1/2 opacity-0 transition-opacity
          group-hover:opacity-100
          focus-visible:opacity-100
        "
      >
        <Link
          to="/taxonomies/media-types/$mediaTypeSlug/edit"
          params={{
            mediaTypeSlug: mediaType.slug,
          }}
          title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
          onClick={event => editClick(event, "media-type", mediaType.id)}
        >
          <Pencil className="size-4" />
          <span className="sr-only">Edit {mediaType.name}</span>
        </Link>
      </Button>
    </RowCard>
  );
}
