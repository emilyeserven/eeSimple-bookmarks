import type { ListSelection } from "../lib/useListSelection";
import type { TagNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Folder, Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LocalizedNameLabel } from "./LocalizedNameLabel";
import { TaxonomyTreeList } from "./TaxonomyTreeRow";
import { useFavoriteToggle } from "../hooks/useFavoriteToggle";

import { Badge } from "@/components/ui/badge";

interface TagTreeListProps {
  /** The root tags to render. */
  tree: TagNode[];
  /** Ids of tags whose children are currently expanded. */
  expanded: Set<string>;
  /** Toggle the expanded state of a tag. */
  onToggle: (id: string) => void;
  /** Number of grid columns. */
  columns: number;
  /** Page-wide multi-select controller (shared with the Table view); rows show checkboxes in mode. */
  selection?: ListSelection;
}

/**
 * Read-only, collapsible tag tree. Each root node is its own card; cards flow in a responsive grid.
 * Callers own the sort order (the tree scaffold's `useSortedTree` applies the multilingual-name re-sort).
 */
export function TagTreeList({
  tree, expanded, onToggle, columns, selection,
}: TagTreeListProps) {
  const {
    t,
  } = useTranslation();
  const favorite = useFavoriteToggle("tag");

  return (
    <TaxonomyTreeList
      tree={tree}
      expanded={expanded}
      onToggle={onToggle}
      columns={columns}
      selection={selection}
      renderExtraBadge={(node) => {
        const count = (node as unknown as TagNode).sectionBookmarkCount ?? 0;
        if (count === 0) return null;
        return (
          <Link
            to="/tags/$tagSlug"
            params={{
              tagSlug: node.slug,
            }}
            search={{
              taggedSections: true,
            }}
            title={t("Bookmarks with sections tagged {{name}}", {
              name: node.name,
            })}
          >
            <Badge
              variant="outline"
              className="text-muted-foreground"
            >
              {count}
            </Badge>
          </Link>
        );
      }}
      isFavorite={node => Boolean((node as unknown as TagNode).isFavorite)}
      onToggleFavorite={node => favorite.toggle({
        id: node.id,
        name: node.name,
        isFavorite: Boolean((node as unknown as TagNode).isFavorite),
      })}
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
          to="/tags/$tagSlug/edit"
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
