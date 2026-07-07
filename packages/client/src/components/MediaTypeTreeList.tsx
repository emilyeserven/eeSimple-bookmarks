import type { MediaTypeNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { TaxonomyTreeList } from "./TaxonomyTreeRow";

import { useBuiltInName } from "@/lib/builtInName";

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
  const {
    t,
  } = useTranslation();
  const builtInName = useBuiltInName();

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
          title={t("Show {{name}} bookmarks", {
            name: node.name,
          })}
          className="
            flex-1 truncate
            hover:underline
          "
        >
          {builtInName(node)}
        </Link>
      )}
      renderEditLink={node => (
        <Link
          to="/taxonomies/media-types/$mediaTypeSlug/edit"
          params={{
            mediaTypeSlug: node.slug,
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
          to="/taxonomies/media-types/$mediaTypeSlug/info"
          params={{
            mediaTypeSlug: node.slug,
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
