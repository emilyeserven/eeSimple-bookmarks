import type { TagNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Folder, Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LocalizedNameLabel } from "./LocalizedNameLabel";
import { TaxonomyTreeList } from "./TaxonomyTreeRow";

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
 * Callers own the sort order (the tree scaffold's `useSortedTree` applies the multilingual-name re-sort).
 */
export function TagTreeList({
  tree, expanded, onToggle, columns,
}: TagTreeListProps) {
  const {
    t,
  } = useTranslation();

  return (
    <TaxonomyTreeList
      tree={tree}
      expanded={expanded}
      onToggle={onToggle}
      columns={columns}
      renderIcon={() => (
        <Folder
          className="size-4 shrink-0 text-muted-foreground"
        />
      )}
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
          title={t("Edit {{name}}", {
            name: node.name,
          })}
        >
          <Pencil className="size-4" />
        </Link>
      )}
      renderInfoLink={node => (
        <Link
          to="/tags/$tagSlug/info"
          params={{
            tagSlug: node.slug,
          }}
          aria-label={t("View {{name}}", {
            name: node.name,
          })}
          title={t("View {{name}}", {
            name: node.name,
          })}
        >
          <Info className="size-4" />
        </Link>
      )}
    />
  );
}
