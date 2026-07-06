import type { WebsiteNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { TaxonomyTreeList } from "./TaxonomyTreeRow";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

interface WebsiteTreeListProps {
  tree: WebsiteNode[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  columns: number;
}

function toTaxonomyNode(node: WebsiteNode): {
  id: string;
  name: string;
  slug: string;
  children: ReturnType<typeof toTaxonomyNode>[];
  builtIn: boolean;
  bookmarkCount?: number;
} {
  return {
    id: node.id,
    name: node.domain,
    slug: node.slug,
    children: node.children.map(toTaxonomyNode),
    builtIn: node.builtIn,
    bookmarkCount: node.bookmarkCount,
  };
}

/** Read-only, collapsible website tree grouped by subdomain relationship. */
export function WebsiteTreeList({
  tree, expanded, onToggle, columns,
}: WebsiteTreeListProps) {
  const {
    t,
  } = useTranslation();
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();

  return (
    <TaxonomyTreeList
      tree={tree.map(toTaxonomyNode)}
      expanded={expanded}
      onToggle={onToggle}
      columns={columns}
      renderNameLink={node => (
        <Link
          to="/taxonomies/websites/$websiteSlug"
          params={{
            websiteSlug: node.slug,
          }}
          title={t("Browse bookmarks from {{name}}", {
            name: node.name,
          })}
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
          to="/taxonomies/websites/$websiteSlug/edit/general"
          params={{
            websiteSlug: node.slug,
          }}
          aria-label={t("Edit {{name}}", {
            name: node.name,
          })}
          title={t("Edit (hold {{modifier}} to open in the sidebar)", {
            modifier: SIDEBAR_MODIFIER_LABELS[modifier],
          })}
          onClick={event => editClick(event, "website", node.id)}
        >
          <Pencil className="size-4" />
        </Link>
      )}
      renderInfoLink={node => (
        <Link
          to="/taxonomies/websites/$websiteSlug/info"
          params={{
            websiteSlug: node.slug,
          }}
          aria-label={t("View {{name}}", {
            name: node.name,
          })}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "website", node.id, node.slug)}
        >
          <Info className="size-4" />
        </Link>
      )}
    />
  );
}
