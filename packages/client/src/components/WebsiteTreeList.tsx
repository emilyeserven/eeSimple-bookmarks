import type { WebsiteNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { TaxonomyTreeList } from "./TaxonomyTreeRow";
import { useFavoriteToggle } from "../hooks/useFavoriteToggle";

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
  isFavorite?: boolean;
} {
  return {
    id: node.id,
    name: node.domain,
    slug: node.slug,
    children: node.children.map(toTaxonomyNode),
    builtIn: node.builtIn,
    bookmarkCount: node.bookmarkCount,
    isFavorite: node.isFavorite,
  };
}

/** Read-only, collapsible website tree grouped by subdomain relationship. */
export function WebsiteTreeList({
  tree, expanded, onToggle, columns,
}: WebsiteTreeListProps) {
  const {
    t,
  } = useTranslation();
  const favorite = useFavoriteToggle("website");

  return (
    <TaxonomyTreeList
      tree={tree.map(toTaxonomyNode)}
      expanded={expanded}
      onToggle={onToggle}
      columns={columns}
      isFavorite={node => Boolean((node as unknown as { isFavorite?: boolean }).isFavorite)}
      onToggleFavorite={node => favorite.toggle({
        id: node.id,
        name: node.name,
        isFavorite: Boolean((node as unknown as { isFavorite?: boolean }).isFavorite),
      })}
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
          to="/taxonomies/websites/$websiteSlug/edit"
          params={{
            websiteSlug: node.slug,
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
          to="/taxonomies/websites/$websiteSlug/info"
          params={{
            websiteSlug: node.slug,
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
