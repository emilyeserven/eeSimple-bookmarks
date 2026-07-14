import type { TaxonomyTermNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LocalizedNameLabel } from "./LocalizedNameLabel";
import { TaxonomyTreeList } from "./TaxonomyTreeRow";
import { useTaxonomyTermFavoriteToggle } from "../hooks/useTaxonomies";

interface TaxonomyTermTreeListProps {
  /** The slug of the owning taxonomy — used to build the term route links. */
  taxonomySlug: string;
  /** The root terms to render. */
  tree: TaxonomyTermNode[];
  /** Ids of terms whose children are currently expanded. */
  expanded: Set<string>;
  /** Toggle the expanded state of a term. */
  onToggle: (id: string) => void;
  /** Number of grid columns. */
  columns: number;
}

/** Read-only, collapsible taxonomy-term tree. Each root node is its own card in a responsive grid.
 * Mirrors `GenreMoodTreeList`/`TagTreeList`, generalized to any user taxonomy. */
export function TaxonomyTermTreeList({
  taxonomySlug, tree, expanded, onToggle, columns,
}: TaxonomyTermTreeListProps) {
  const {
    t,
  } = useTranslation();
  const taxonomyId = tree[0]?.taxonomyId ?? "";
  const favorite = useTaxonomyTermFavoriteToggle(taxonomyId);

  return (
    <TaxonomyTreeList
      tree={tree}
      expanded={expanded}
      onToggle={onToggle}
      columns={columns}
      isFavorite={node => Boolean((node as unknown as TaxonomyTermNode).isFavorite)}
      onToggleFavorite={node => favorite.toggle({
        id: node.id,
        name: node.name,
        isFavorite: Boolean((node as unknown as TaxonomyTermNode).isFavorite),
      })}
      renderNameLink={node => (
        <Link
          to="/taxonomies/$taxonomyKey/$termSlug"
          params={{
            taxonomyKey: taxonomySlug,
            termSlug: node.slug,
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
            names={(node as unknown as TaxonomyTermNode).names ?? []}
            base={node.name}
          />
        </Link>
      )}
      renderEditLink={node => (
        <Link
          to="/taxonomies/$taxonomyKey/$termSlug/edit"
          params={{
            taxonomyKey: taxonomySlug,
            termSlug: node.slug,
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
          to="/taxonomies/$taxonomyKey/$termSlug/info"
          params={{
            taxonomyKey: taxonomySlug,
            termSlug: node.slug,
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
