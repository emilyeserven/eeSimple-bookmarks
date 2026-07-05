import type { EntityDescriptor, EntityTreeListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { GenreMoodNode, UpdateGenreMoodInput } from "@eesimple/types";

import { GenreMoodTable } from "../components/GenreMoodTable";
import { GenreMoodTreeList } from "../components/GenreMoodTreeList";
import { genreMoodWorkbench } from "../components/workbench/genreMood";
import { useBulkDeleteGenreMoods, useGenreMoodTree } from "../hooks/useGenreMoods";
import i18n from "../i18n";
import { genreMoodsApi } from "../lib/api/taxonomies";
import { flattenTree } from "../lib/tagTree";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const GENRE_MOOD_ROUTE: EntityRoute = {
  kind: "genre-mood",
  prefix: "/taxonomies/genres-moods",
  slugIndex: 2,
  listLabel: i18n.t("Genres & Moods"),
  singular: i18n.t("Genres & Moods entry"),
  // Unlike Tags/Media Types/Locations, the tree is surfaced via a view-only Hierarchy tab rather
  // than an ancestor-chain breadcrumb, so the detail/edit crumbs are the shared flat `List → Name`.
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const GENRE_MOOD_PALETTE: EntityPaletteConfig = {
  queryKey: ["genre-moods"],
  listFn: () => genreMoodsApi.list(),
  updateFn: (id, patch) => genreMoodsApi.update(id, patch as UpdateGenreMoodInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
};

export const genreMoodTreeListingConfig: EntityTreeListingConfig<GenreMoodNode> = {
  pageKey: "genre-moods-listing",
  useTree: useGenreMoodTree,
  matches: (node, query) =>
    node.name.toLowerCase().includes(query)
    || node.slug.toLowerCase().includes(query)
    || (node.names ?? []).some(n => n.value.toLowerCase().includes(query)),
  deletableIds: tree => flattenTree(tree).map(f => f.node.id),
  useBulkDelete: useBulkDeleteGenreMoods,
  noun: [i18n.t("entry"), i18n.t("entries")],
  loadingLabel: i18n.t("Loading Genres & Moods…"),
  entityPlural: i18n.t("Genres & Moods"),
  emptyMessage: (
    <p className="text-muted-foreground">
      {i18n.t("No Genres & Moods yet.")}
    </p>
  ),
  renderTree: ({
    sortedTree, expanded, onToggle, columns,
  }) => (
    <GenreMoodTreeList
      tree={sortedTree}
      expanded={expanded}
      onToggle={onToggle}
      columns={columns}
    />
  ),
  renderTable: ({
    sortedTree, selection,
  }) => (
    <GenreMoodTable
      tree={sortedTree}
      selection={selection}
    />
  ),
};

export const genreMoodDescriptor: EntityDescriptor<GenreMoodNode, GenreMoodNode> = {
  kind: "genre-mood",
  route: GENRE_MOOD_ROUTE,
  palette: GENRE_MOOD_PALETTE,
  workbench: genreMoodWorkbench,
  treeListing: genreMoodTreeListingConfig,
};
