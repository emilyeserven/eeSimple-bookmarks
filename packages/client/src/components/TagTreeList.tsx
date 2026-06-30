import type { TaxonomyTreeNode } from "./TaxonomyTreeRow";
import type { TagNode } from "@eesimple/types";

import { useMemo } from "react";

import { Link } from "@tanstack/react-router";
import { Folder, Info, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { RomanizedLabel } from "./RomanizedLabel";
import { TagCategoriesPopover } from "./TagCategoriesPopover";
import { TaxonomyTreeList } from "./TaxonomyTreeRow";
import { useSidebarOpenModifier, useSortByRomanized } from "../hooks/useAppSettings";
import { sortTagTreeByRomanized } from "../lib/tagTree";

import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

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
  const modifier = useSidebarOpenModifier();
  const sortByRomanized = useSortByRomanized();
  const sortedTree = useMemo(
    () => sortTagTreeByRomanized(tree, sortByRomanized),
    [tree, sortByRomanized],
  );

  return (
    <TaxonomyTreeList
      tree={sortedTree}
      expanded={expanded}
      onToggle={onToggle}
      columns={columns}
      renderIcon={(node: TaxonomyTreeNode) => {
        const tagNode = node as unknown as TagNode;
        if (tagNode.parentId !== null) {
          return <Folder className="size-4 shrink-0 text-muted-foreground" />;
        }
        return (
          <TagCategoriesPopover
            tagId={tagNode.id}
            tagName={tagNode.name}
          />
        );
      }}
      renderNameLink={node => (
        <Link
          to="/tags/$tagSlug"
          params={{
            tagSlug: node.slug,
          }}
          title={`Browse bookmarks tagged ${node.name}`}
          className="
            flex-1 truncate
            hover:underline
          "
        >
          <RomanizedLabel
            name={node.name}
            romanized={(node as unknown as TagNode).romanizedName}
          />
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
          to="/tags/$tagSlug/general"
          params={{
            tagSlug: node.slug,
          }}
          aria-label={`View ${node.name}`}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "tag", node.id, node.slug)}
        >
          <Info className="size-4" />
        </Link>
      )}
    />
  );
}
