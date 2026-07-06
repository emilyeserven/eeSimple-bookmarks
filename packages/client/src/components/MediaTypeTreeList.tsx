import type { MediaTypeNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { TaxonomyTreeList } from "./TaxonomyTreeRow";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { useBuiltInName } from "@/lib/builtInName";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

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
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
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
          title={t("Edit (hold {{modifier}} to open in the sidebar)", {
            modifier: SIDEBAR_MODIFIER_LABELS[modifier],
          })}
          onClick={event => editClick(event, "media-type", node.id)}
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
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "media-type", node.id, node.slug)}
        >
          <Info className="size-4" />
        </Link>
      )}
    />
  );
}
