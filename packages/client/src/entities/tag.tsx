import type { EntityDescriptor, EntityTreeListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Tag, TagNode, UpdateTagInput } from "@eesimple/types";

import { TagTable } from "../components/TagTable";
import { TagTreeList } from "../components/TagTreeList";
import { tagWorkbench } from "../components/workbench/tag";
import { useBulkDeleteTags, useTagTree } from "../hooks/useTags";
import { useInterfaceTitleSort } from "../hooks/useTitleSortContext";
import i18n from "../i18n";
import { tagsApi } from "../lib/api/taxonomies";
import { flattenTree, sortTagTree } from "../lib/tagTree";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const TAG_ROUTE: EntityRoute = {
  kind: "tag",
  prefix: "/tags",
  slugIndex: 1,
  listLabel: i18n.t("Tags"),
  singular: i18n.t("Tag"),
  flatCrumbs: false,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const TAG_PALETTE: EntityPaletteConfig = {
  queryKey: ["tags"],
  listFn: () => tagsApi.list(),
  updateFn: (id, patch) => tagsApi.update(id, patch as UpdateTagInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
  fields: [
    {
      type: "boolean",
      key: "editableOnCard",
      label: i18n.t("Editable on Card"),
      getValue: entity => (entity as Tag).editableOnCard ?? false,
    },
    {
      type: "boolean",
      key: "excludeFromBackfill",
      label: i18n.t("Exclude from Backfill"),
      getValue: entity => (entity as Tag).excludeFromBackfill ?? false,
    },
  ],
};

/** Name-based re-sort for the filtered tag tree — the `useSortedTree` slot (see the config's doc). */
function useNameSortedTree(tree: TagNode[]): TagNode[] {
  const titleSort = useInterfaceTitleSort();
  return sortTagTree(tree, titleSort);
}

/**
 * A factory (rather than a static config) only because the empty-state copy embeds an "Add your
 * first tag" button, whose handler is owned by the listing route (it opens `AddTagModal`).
 */
export function buildTagTreeListingConfig(opts: { onNew: () => void }): EntityTreeListingConfig<TagNode> {
  return {
    pageKey: "tags-listing",
    useTree: useTagTree,
    matches: (node, query) =>
      node.name.toLowerCase().includes(query)
      || node.slug.toLowerCase().includes(query)
      || (node.names ?? []).some(n => n.value.toLowerCase().includes(query)),
    deletableIds: tree => flattenTree(tree).map(f => f.node.id),
    useBulkDelete: useBulkDeleteTags,
    noun: [i18n.t("tag"), i18n.t("tags")],
    loadingLabel: i18n.t("Loading tags…"),
    entityPlural: i18n.t("tags"),
    emptyMessage: (
      <p className="text-muted-foreground">
        {`${i18n.t("No tags yet.")} `}
        <button
          type="button"
          className="
            underline
            hover:no-underline
          "
          onClick={opts.onNew}
        >
          {i18n.t("Add your first tag.")}
        </button>
      </p>
    ),
    useSortedTree: useNameSortedTree,
    renderTree: ({
      sortedTree, expanded, onToggle, columns,
    }) => (
      <TagTreeList
        tree={sortedTree}
        expanded={expanded}
        onToggle={onToggle}
        columns={columns}
      />
    ),
    renderTable: ({
      sortedTree, selection,
    }) => (
      <TagTable
        tree={sortedTree}
        selection={selection}
      />
    ),
  };
}

/** Thirteenth `EntityDescriptor` migration — the second tree taxonomy on the tree scaffold (issue #860, batch 3). */
export const tagDescriptor: EntityDescriptor<TagNode, TagNode> = {
  kind: "tag",
  route: TAG_ROUTE,
  palette: TAG_PALETTE,
  workbench: tagWorkbench,
  treeListing: buildTagTreeListingConfig({
    onNew: () => undefined,
  }),
};
