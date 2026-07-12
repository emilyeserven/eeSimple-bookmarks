import type { EntityTreeListingConfig } from "./types";
import type { Taxonomy, TaxonomyTermNode } from "@eesimple/types";

import { TaxonomyTermTable } from "../components/TaxonomyTermTable";
import { TaxonomyTermTreeList } from "../components/TaxonomyTermTreeList";
import { useBulkDeleteTaxonomyTerms, useTaxonomyTermTree } from "../hooks/useTaxonomies";
import i18n from "../i18n";
import { flattenTree } from "../lib/tagTree";

/**
 * A factory (rather than a static config) since there can be any number of user-created taxonomies —
 * mirrors `genreMoodTreeListingConfig`/`buildTagTreeListingConfig`, generalized to any taxonomy.
 */
export function buildTaxonomyTermTreeListingConfig(
  taxonomy: Taxonomy,
  opts: { onNew: () => void },
): EntityTreeListingConfig<TaxonomyTermNode> {
  return {
    pageKey: `taxonomy-${taxonomy.id}-listing`,
    useTree: () => useTaxonomyTermTree(taxonomy.id),
    matches: (node, query) =>
      node.name.toLowerCase().includes(query)
      || node.slug.toLowerCase().includes(query)
      || (node.names ?? []).some(n => n.value.toLowerCase().includes(query)),
    deletableIds: tree => flattenTree(tree).map(f => f.node.id),
    useBulkDelete: () => useBulkDeleteTaxonomyTerms(taxonomy.id),
    noun: [i18n.t("term"), i18n.t("terms")],
    loadingLabel: i18n.t("Loading {{name}}…", {
      name: taxonomy.name,
    }),
    entityPlural: taxonomy.name,
    emptyMessage: (
      <p className="text-muted-foreground">
        {`${i18n.t("No terms yet.")} `}
        <button
          type="button"
          className="
            underline
            hover:no-underline
          "
          onClick={opts.onNew}
        >
          {i18n.t("Add your first term.")}
        </button>
      </p>
    ),
    renderTree: ({
      sortedTree, expanded, onToggle, columns,
    }) => (
      <TaxonomyTermTreeList
        taxonomySlug={taxonomy.slug}
        tree={sortedTree}
        expanded={expanded}
        onToggle={onToggle}
        columns={columns}
      />
    ),
    renderTable: ({
      sortedTree, selection,
    }) => (
      <TaxonomyTermTable
        taxonomySlug={taxonomy.slug}
        tree={sortedTree}
        selection={selection}
      />
    ),
  };
}
