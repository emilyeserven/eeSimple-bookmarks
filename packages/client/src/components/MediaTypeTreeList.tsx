import type { MediaTypeNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { TaxonomyTreeList } from "./TaxonomyTreeRow";

import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

interface MediaTypeTreeListProps {
  /** The root media types to render. */
  tree: MediaTypeNode[];
  /** Ids of media types whose children are currently expanded. */
  expanded: Set<string>;
  /** Toggle the expanded state of a media type. */
  onToggle: (id: string) => void;
  /** Number of grid columns. */
  columns: number;
}

/** Read-only, collapsible media-type tree. Each root node is its own card; cards flow in a responsive grid. */
export function MediaTypeTreeList({
  tree, expanded, onToggle, columns,
}: MediaTypeTreeListProps) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);

  return (
    <TaxonomyTreeList
      tree={tree}
      expanded={expanded}
      onToggle={onToggle}
      columns={columns}
      renderNameLink={node => (
        <Link
          to="/taxonomies/media-types/$mediaTypeSlug"
          params={{
            mediaTypeSlug: node.slug,
          }}
          title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
          onClick={event => viewClick(event, "media-type", node.id)}
          className="
            flex-1 truncate
            hover:underline
          "
        >
          {node.name}
        </Link>
      )}
      renderEditLink={node => (
        <Link
          to="/taxonomies/media-types/$mediaTypeSlug/edit"
          params={{
            mediaTypeSlug: node.slug,
          }}
          aria-label={`Edit ${node.name}`}
          title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
          onClick={event => editClick(event, "media-type", node.id)}
        >
          <Pencil className="size-4" />
        </Link>
      )}
    />
  );
}
