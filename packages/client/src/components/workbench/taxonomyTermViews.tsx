import type { Taxonomy, TaxonomyTermNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { TaxonomyNodeStats } from "./TaxonomyNodeStats";
import { HierarchyView } from "../HierarchyView";
import { LocalizedNameLabel } from "../LocalizedNameLabel";
import { TaxonomyTermTreeList } from "../TaxonomyTermTreeList";

import { useExpandedSet } from "@/hooks/useExpandedSet";
import { useTaxonomyTermTree } from "@/hooks/useTaxonomies";
import { findAncestorPath, flattenTree } from "@/lib/tagTree";

/** The term's read-only stat grid (the `stats` layout field). Mirrors `GenreMoodStatsView`. */
export function buildTaxonomyTermStatsView(taxonomy: Taxonomy) {
  return function TaxonomyTermStatsView({
    entity: node,
  }: {
    entity: TaxonomyTermNode;
  }) {
    const {
      data,
    } = useTaxonomyTermTree(taxonomy.id);
    const parent = node.parentId
      ? flattenTree(data ?? []).find(item => item.node.id === node.parentId)?.node
      : null;
    return (
      <TaxonomyNodeStats
        node={node}
        parent={parent}
      />
    );
  };
}

/** The term's view-only Hierarchy tab body (parents + children). Mirrors `GenreMoodHierarchyView`;
 * only surfaced when `taxonomy.hierarchical`. */
export function buildTaxonomyTermHierarchyView(taxonomy: Taxonomy) {
  return function TaxonomyTermHierarchyView({
    entity: term,
  }: {
    entity: TaxonomyTermNode;
  }) {
    const {
      t,
    } = useTranslation();
    const {
      data, isLoading,
    } = useTaxonomyTermTree(taxonomy.id);
    const tree = data ?? [];
    const node = flattenTree(tree).find(flat => flat.node.slug === term.slug)?.node;
    const {
      expanded, onToggle,
    } = useExpandedSet(node?.children.map(c => c.id) ?? []);

    if (isLoading && !node) return <p className="text-muted-foreground">{t("Loading…")}</p>;
    if (!node) return <p className="text-destructive">{t("Term not found.")}</p>;

    const path = findAncestorPath(tree, term.slug);
    const ancestors = path ? path.slice(0, -1) : [];

    return (
      <HierarchyView
        ancestors={ancestors}
        renderAncestorLink={ancestor => (
          <Link
            to="/taxonomies/$taxonomyKey/$termSlug/info"
            params={{
              taxonomyKey: taxonomy.slug,
              termSlug: ancestor.slug,
            }}
            className="hover:underline"
          >
            <LocalizedNameLabel
              names={ancestor.names ?? []}
              base={ancestor.name}
            />
          </Link>
        )}
        hasChildren={node.children.length > 0}
        childrenEmptyLabel={t("No child terms.")}
        childrenList={(
          <TaxonomyTermTreeList
            taxonomySlug={taxonomy.slug}
            tree={node.children}
            expanded={expanded}
            onToggle={onToggle}
            columns={1}
          />
        )}
      />
    );
  };
}
