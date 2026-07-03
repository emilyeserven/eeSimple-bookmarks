import type { EntityDescriptor, EntityTreeListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { GenreMoodNode, UpdateGenreMoodInput } from "@eesimple/types";

import { GenreMoodTable } from "../components/GenreMoodTable";
import { GenreMoodTreeList } from "../components/GenreMoodTreeList";
import { genreMoodWorkbench } from "../components/workbench/genreMood";
import { useBulkDeleteGenreMoods, useGenreMoodTree } from "../hooks/useGenreMoods";
import { genreMoodsApi } from "../lib/api/taxonomies";
import { flattenTree } from "../lib/tagTree";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Hoisted so `entityRoutes.ts`'s `ENTITY_ROUTES` can reference this entry by identity. */
export const GENRE_MOOD_ROUTE: EntityRoute = {
  kind: "genre-mood",
  prefix: "/taxonomies/genres-moods",
  slugIndex: 2,
  listLabel: "Genres & Moods",
  singular: "Genres & Moods entry",
  // Tree taxonomy — detail crumbs are bespoke like Tags/Locations, so excluded from flat crumbs.
  flatCrumbs: false,
};

/** Hoisted so `entityPaletteRegistry.ts`'s `ENTITY_PALETTE_CONFIGS` can reference this entry by identity. */
export const GENRE_MOOD_PALETTE: EntityPaletteConfig = {
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
    || (node.romanizedName ?? "").toLowerCase().includes(query),
  deletableIds: tree => flattenTree(tree).map(f => f.node.id),
  useBulkDelete: useBulkDeleteGenreMoods,
  noun: ["entry", "entries"],
  loadingLabel: "Loading Genres & Moods…",
  entityPlural: "Genres & Moods",
  emptyMessage: (
    <p className="text-muted-foreground">
      No Genres & Moods yet.
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
