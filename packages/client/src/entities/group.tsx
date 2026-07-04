import type { EntityDescriptor, EntityListingConfig } from "./types";
import type { EntityPaletteConfig } from "../lib/entityPaletteRegistry";
import type { EntityRoute } from "../lib/entityRoutes";
import type { Group, UpdateGroupInput } from "@eesimple/types";

import { GroupListItem } from "../components/GroupListItem";
import { GroupTable } from "../components/GroupTable";
import { groupWorkbench } from "../components/workbench/group";
import { useBulkDeleteGroups, useGroups } from "../hooks/useGroups";
import { groupsApi } from "../lib/api/taxonomies";

const BOOKMARKS_KEY = ["bookmarks"] as const;

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_ROUTES` derives from). */
const GROUP_ROUTE: EntityRoute = {
  kind: "group",
  prefix: "/taxonomies/groups",
  slugIndex: 2,
  listLabel: "Groups",
  singular: "Group",
  flatCrumbs: true,
};

/** Referenced by this entity's descriptor below, which `entities/registry.ts` aggregates into `ENTITY_DESCRIPTORS` (the source `ENTITY_PALETTE_CONFIGS` derives from). */
const GROUP_PALETTE: EntityPaletteConfig = {
  queryKey: ["groups"],
  listFn: () => groupsApi.list(),
  updateFn: (id, patch) => groupsApi.update(id, patch as UpdateGroupInput),
  extraInvalidateKeys: [BOOKMARKS_KEY],
};

export const groupListingConfig: EntityListingConfig<Group> = {
  pageKey: "groups-listing",
  useItems: useGroups,
  matches: (group, query) => group.name.toLowerCase().includes(query),
  useBulkDelete: useBulkDeleteGroups,
  noun: ["group", "groups"],
  loadingLabel: "Loading groups…",
  entityPlural: "groups",
  emptyMessage: (
    <p className="text-muted-foreground">
      No groups yet. Add one above, then assign them to bookmarks.
    </p>
  ),
  renderListItem: ({
    entity, allItems, ...rest
  }) => (
    <GroupListItem
      group={entity}
      {...rest}
    />
  ),
  renderTable: ({
    entities, selection,
  }) => (
    <GroupTable
      groups={entities}
      selection={selection}
    />
  ),
};

/** `EntityDescriptor` aggregated into `ENTITY_DESCRIPTORS` (`entities/registry.ts`) — issue #860. */
export const groupDescriptor: EntityDescriptor<Group> = {
  kind: "group",
  route: GROUP_ROUTE,
  palette: GROUP_PALETTE,
  workbench: groupWorkbench,
  listing: groupListingConfig,
};
