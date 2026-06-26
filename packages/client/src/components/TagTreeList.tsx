import type { TaxonomyTreeNode } from "./TaxonomyTreeRow";
import type { TagNode } from "@eesimple/types";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { Folder, FolderOpen, Info, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { TaxonomyTreeList } from "./TaxonomyTreeRow";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { useCategories } from "../hooks/useCategories";
import { useTagCategories } from "../hooks/useTags";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

interface TagCategoriesPopoverProps {
  tagId: string;
  tagName: string;
}

function TagCategoriesPopover({
  tagId, tagName,
}: TagCategoriesPopoverProps) {
  const [open, setOpen] = useState(false);
  const {
    data: categoryIds, isLoading,
  } = useTagCategories(tagId, {
    enabled: open,
  });
  const {
    data: allCategories,
  } = useCategories();

  const assignedCategories = categoryIds && allCategories && categoryIds.length > 0
    ? allCategories.filter(c => categoryIds.includes(c.id))
    : null;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Categories for ${tagName}`}
          onClick={e => e.stopPropagation()}
          className="
            text-muted-foreground transition-colors
            hover:text-foreground
          "
        >
          {open
            ? <FolderOpen className="size-4 shrink-0" />
            : <Folder className="size-4 shrink-0" />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-3"
        align="start"
      >
        <p
          className="
            mb-2 text-xs font-semibold tracking-wide text-muted-foreground
            uppercase
          "
        >
          Categories
        </p>
        {isLoading || categoryIds === undefined
          ? <p className="text-sm text-muted-foreground">Loading…</p>
          : categoryIds.length === 0
            ? <p className="text-sm text-muted-foreground italic">All categories</p>
            : (
              <ul className="space-y-1">
                {(assignedCategories ?? []).map(c => (
                  <li
                    key={c.id}
                    className="text-sm"
                  >
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
      </PopoverContent>
    </Popover>
  );
}

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
          title={`Browse bookmarks tagged ${node.name}`}
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
