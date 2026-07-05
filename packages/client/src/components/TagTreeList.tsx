import type { TaxonomyTreeNode } from "./TaxonomyTreeRow";
import type { TagNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Folder, Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LocalizedNameLabel } from "./LocalizedNameLabel";
import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { TagCategoriesPopover } from "./TagCategoriesPopover";
import { TaxonomyTreeList } from "./TaxonomyTreeRow";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

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

/**
 * Read-only, collapsible tag tree. Each root node is its own card; cards flow in a responsive grid.
 * Callers own the sort order (the tree scaffold's `useSortedTree` applies the romanized re-sort).
 */
export function TagTreeList({
  tree, expanded, onToggle, columns,
}: TagTreeListProps) {
  const {
    t,
  } = useTranslation();
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();

  return (
    <TaxonomyTreeList
      tree={tree}
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
          title={t("Browse bookmarks tagged {{name}}", {
            name: node.name,
          })}
          className="
            flex-1 truncate
            hover:underline
          "
        >
          <LocalizedNameLabel
            names={(node as unknown as TagNode).names ?? []}
            base={node.name}
          />
        </Link>
      )}
      renderEditLink={node => (
        <Link
          to="/tags/$tagSlug/edit/general"
          params={{
            tagSlug: node.slug,
          }}
          aria-label={t("Edit {{name}}", {
            name: node.name,
          })}
          title={t("Edit (hold {{modifier}} to open in the sidebar)", {
            modifier: SIDEBAR_MODIFIER_LABELS[modifier],
          })}
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
          aria-label={t("View {{name}}", {
            name: node.name,
          })}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "tag", node.id, node.slug)}
        >
          <Info className="size-4" />
        </Link>
      )}
    />
  );
}
