import type { GenreMoodNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LocalizedNameLabel } from "./LocalizedNameLabel";
import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
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
      renderNameLink={node => (
        <Link
          to="/taxonomies/genres-moods/$genreMoodSlug"
          params={{
            genreMoodSlug: node.slug,
          }}
          title={t("Show {{name}} bookmarks", {
            name: node.name,
          })}
          className="
            flex-1 truncate
            hover:underline
          "
        >
          <LocalizedNameLabel
            names={(node as unknown as GenreMoodNode).names ?? []}
            base={node.name}
          />
        </Link>
      )}
      renderEditLink={node => (
        <Link
          to="/taxonomies/genres-moods/$genreMoodSlug/edit"
          params={{
            genreMoodSlug: node.slug,
          }}
          aria-label={t("Edit {{name}}", {
            name: node.name,
          })}
          title={t("Edit (hold {{modifier}} to open in the sidebar)", {
            modifier: SIDEBAR_MODIFIER_LABELS[modifier],
          })}
          onClick={event => editClick(event, "genre-mood", node.id)}
        >
          <Pencil className="size-4" />
        </Link>
      )}
      renderInfoLink={node => (
        <Link
          to="/taxonomies/genres-moods/$genreMoodSlug/info"
          params={{
            genreMoodSlug: node.slug,
          }}
          aria-label={t("View {{name}}", {
            name: node.name,
          })}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "genre-mood", node.id, node.slug)}
        >
          <Info className="size-4" />
        </Link>
      )}
    />
  );
}
