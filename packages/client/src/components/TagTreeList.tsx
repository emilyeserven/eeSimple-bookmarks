import type { TagNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { TaxonomyTreeList } from "./TaxonomyTreeRow";

import { withTags } from "@/lib/bookmarkSearch";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

interface TagTreeListProps {
  /** The root tags to render. */
  tree: TagNode[];
  /** Ids of tags whose children are currently expanded. */
  expanded: Set<string>;
  /** Toggle the expanded state of a tag. */
  onToggle: (id: string) => void;
  /** Number of grid columns. */
  columns: number;
}

/** Read-only, collapsible tag tree. Each root node is its own card; cards flow in a responsive grid. */
export function TagTreeList({
  tree, expanded, onToggle, columns,
}: TagTreeListProps) {
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
          to="/bookmarks"
          search={withTags({}, [node.id])}
          title={`Show bookmarks tagged ${node.name}`}
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
          to="/tags/$tagSlug/edit/general"
          params={{
            tagSlug: node.slug,
          }}
          aria-label={`Edit ${node.name}`}
          title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
          onClick={event => editClick(event, "tag", node.id)}
        >
          <Pencil className="size-4" />
        </Link>
      )}
      renderInfoLink={node => (
        <Link
          to="/tags/$tagSlug"
          params={{
            tagSlug: node.slug,
          }}
          aria-label={`View ${node.name}`}
          title={`Info (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
          onClick={event => viewClick(event, "tag", node.id)}
        >
          <Info className="size-4" />
        </Link>
      )}
    />
  );
}
