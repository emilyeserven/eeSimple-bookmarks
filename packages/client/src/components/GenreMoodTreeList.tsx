import type { GenreMoodNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { RomanizedLabel } from "./RomanizedLabel";
import { TaxonomyTreeList } from "./TaxonomyTreeRow";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

interface GenreMoodTreeListProps {
  /** The root entries to render. */
  tree: GenreMoodNode[];
  /** Ids of entries whose children are currently expanded. */
  expanded: Set<string>;
  /** Toggle the expanded state of an entry. */
  onToggle: (id: string) => void;
  /** Number of grid columns. */
  columns: number;
}

/** Read-only, collapsible Genres & Moods tree. Each root node is its own card in a responsive grid. */
export function GenreMoodTreeList({
  tree, expanded, onToggle, columns,
}: GenreMoodTreeListProps) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();

  return (
    <TaxonomyTreeList
      tree={tree}
      expanded={expanded}
      onToggle={onToggle}
      columns={columns}
      renderNameLink={node => (
        <Link
          to="/taxonomies/genres-moods/$genreMoodSlug"
          params={{
            genreMoodSlug: node.slug,
          }}
          title={`Show ${node.name} bookmarks`}
          className="
            flex-1 truncate
            hover:underline
          "
        >
          <RomanizedLabel
            name={node.name}
            romanized={(node as unknown as GenreMoodNode).romanizedName}
          />
        </Link>
      )}
      renderEditLink={node => (
        <Link
          to="/taxonomies/genres-moods/$genreMoodSlug/edit"
          params={{
            genreMoodSlug: node.slug,
          }}
          aria-label={`Edit ${node.name}`}
          title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
          onClick={event => editClick(event, "genre-mood", node.id)}
        >
          <Pencil className="size-4" />
        </Link>
      )}
      renderInfoLink={node => (
        <Link
          to="/taxonomies/genres-moods/$genreMoodSlug/general"
          params={{
            genreMoodSlug: node.slug,
          }}
          aria-label={`View ${node.name}`}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "genre-mood", node.id, node.slug)}
        >
          <Info className="size-4" />
        </Link>
      )}
    />
  );
}
